#![no_std]
#![no_main]

extern crate elrond_wasm;

use elrond_wasm as ew;
use elrond_wasm::BigInt;


static TOTAL_SUPPLY_KEY: [u8; 32] = [0u8; 32];

static APPROVE_EVENT:  [u8; 32] = [0x71,0x34,0x69,0x2B,0x23,0x0B,0x9E,0x1F,0xFA,0x39,0x09,0x89,0x04,0x72,0x21,0x34,0x15,0x96,0x52,0xB0,0x9C,0x5B,0xC4,0x1D,0x88,0xD6,0x69,0x87,0x79,0xD2,0x28,0xFF];
static TRANSFER_EVENT: [u8; 32] = [0xF0,0x99,0xCD,0x8B,0xDE,0x55,0x78,0x14,0x84,0x2A,0x31,0x21,0xE8,0xDD,0xFD,0x43,0x3A,0x53,0x9B,0x8C,0x9F,0x14,0xBF,0x31,0xEB,0xF1,0x08,0xD1,0x2E,0x61,0x96,0xE9];


// Generates a balance key for some address.
// Used to map balances with their owners.
fn balance_key(address: &[u8; 32]) -> [u8; 32] {
  let mut key = [0u8; 32];
  // reserve one byte of the key to indicate key type
  // "1" is for balance keys
  key[0] = 1;

  // the last 2 bytes of the address are only used to identify the shard, 
  // so they are disposable when constructing the key
  for i in 0..30 {
    key[2+i] = address[i];
  }

  key
}

fn allowance_key(from: &[u8; 32], to: &[u8; 32]) -> [u8; 32] {
  let mut key = [0u8; 32];
  // reserve one byte of the key to indicate key type
  // "2" is for allowance keys
  key[0] = 2;

  // Note: in smart contract addresses, the first 10 bytes are all 0
  // therefore we read from byte 10 onwards to provide more significant bytes
  // and to minimize the chance for collisions
  // TODO: switching to a hash instead of a concatenation of addresses might make it safer
  for i in 0..15 {
    key[1+i] = from[10+i];
  }
  for i in 0..16 {
    key[16+i] = to[10+i];
  }

  key
}

// both transfer and approve have 3 topics (event identifier, sender, recipient)
// so both prepare the log the same way
fn save_log_with_3_topics(topic1: &[u8; 32], topic2: &[u8; 32], topic3: &[u8; 32], value: &BigInt) {
  let topics = [*topic1, *topic2, *topic3];

  let data_vec = value.get_bytes_big_endian_pad_right(32);

  // call api
  ew::write_log(&topics[..], data_vec.as_slice());
}

// constructor function
// is called immediately after the contract is created
// will set the fixed global token supply and give all the supply to the creator
#[no_mangle]
pub extern fn init() {
  if ew::get_num_arguments() != 1 {
    ew::signal_error();
    return;
  }

  let sender = ew::get_caller();
  let total_supply = ew::get_argument_big_int(0);

  // save total supply
  ew::storage_store_big_int(&TOTAL_SUPPLY_KEY, &total_supply);

  // sender balance <- total supply
  let balance_key = balance_key(&sender);
  ew::storage_store_big_int(&balance_key, &total_supply);
}

// getter function: retrieves total token supply
#[no_mangle]
pub extern fn totalSupply() {
  if ew::get_num_arguments() != 0 {
    ew::signal_error();
    return;
  }

  let total_supply = ew::storage_load_big_int(&TOTAL_SUPPLY_KEY);
  
  // return total supply as big int
  ew::finish_big_int(total_supply);
}

// getter function: retrieves balance for an account
#[no_mangle]
pub extern fn balanceOf() {
  if ew::get_num_arguments() != 1 {
    ew::signal_error();
    return;
  }

  let subject = ew::get_argument_bytes32(0);

  // load balance
  let balance_key = balance_key(&subject);
  let balance = ew::storage_load_big_int(&balance_key);

  // return balance as big int
  ew::finish_big_int(balance);
}

// getter function: retrieves allowance granted from one account to another
#[no_mangle]
pub extern fn allowance() {
  if ew::get_num_arguments() != 2 {
    ew::signal_error();
    return;
  }

  // 1st argument: owner
  let sender = ew::get_argument_bytes32(0);

  // 2nd argument: spender
  let recipient = ew::get_argument_bytes32(1);

  // get allowance
  let allowance_key = allowance_key(&sender, &recipient);
  let allowance = ew::storage_load_big_int(&allowance_key);

  // return allowance as big int
  ew::finish_big_int(allowance);
}

fn perform_transfer(sender: &[u8; 32], recipient: &[u8; 32], amount: BigInt) {
  // load sender balance
  let sender_balance_key = balance_key(&sender);
  let mut sender_balance = ew::storage_load_big_int(&sender_balance_key);

  // check if enough funds
  if BigInt::compare(&amount, &sender_balance) > 0 {
    ew::signal_error();
    return;
  }

  // update sender balance
  sender_balance -= &amount;
  ew::storage_store_big_int(&sender_balance_key, &sender_balance);

  // load & update receiver balance
  let rec_balance_key = balance_key(&recipient);
  let mut rec_balance = ew::storage_load_big_int(&rec_balance_key);
  rec_balance += &amount;
  ew::storage_store_big_int(&rec_balance_key, &rec_balance);

  // log operation
  save_log_with_3_topics(&TRANSFER_EVENT, &sender, &recipient, &amount);
}

// transfers tokens from sender to another account
#[no_mangle]
pub extern fn transferToken() {
  if ew::get_num_arguments() != 2 {
    ew::signal_error();
    return;
  }

  // sender is the caller
  let sender = ew::get_caller();

  // 1st argument: recipient
  let recipient = ew::get_argument_bytes32(0);

  // 2nd argument: amount (should not be negative)
  let amount = ew::get_argument_big_int(1);
  if BigInt::compare(&amount, &BigInt::from_i64(0)) < 0 {
    ew::signal_error();
    return;
  }

  perform_transfer(&sender, &recipient, amount);

  // return "true"
  ew::finish_i64(1); 
}

// sender allows beneficiary to use given amount of tokens from sender's balance
// it will completely overwrite any previously existing allowance from sender to beneficiary
#[no_mangle]
pub extern fn approve() {
  if ew::get_num_arguments() != 2 {
    ew::signal_error();
    return;
  }

  // sender is the caller
  let sender = ew::get_caller();

  // 1st argument: spender (beneficiary)
  let recipient = ew::get_argument_bytes32(0);

  // 2nd argument: amount (should not be negative)
  let amount = ew::get_argument_big_int(1);
  if BigInt::compare(&amount, &BigInt::from_i64(0)) < 0 {
    ew::signal_error();
    return;
  }

  // store allowance
  let allowance_key = allowance_key(&sender, &recipient);
  ew::storage_store_big_int(&allowance_key, &amount);

  // log operation
  save_log_with_3_topics(&APPROVE_EVENT, &sender, &recipient, &amount);

  // return "true"
  ew::finish_i64(1); 
}

// caller uses allowance to transfer funds between 2 other accounts
#[no_mangle]
pub extern fn transferFrom() {
  if ew::get_num_arguments() != 3 {
    ew::signal_error();
    return;
  }

  // get caller
  let caller = ew::get_caller();

  // 1st argument: sender
  let sender = ew::get_argument_bytes32(0);

  // 2nd argument: recipient
  let recipient = ew::get_argument_bytes32(1);

  // 3rd argument: amount
  let amount = ew::get_argument_big_int(2);
  if BigInt::compare(&amount, &BigInt::from_i64(0)) < 0 {
    ew::signal_error();
    return;
  }

  // load allowance
  let allowance_key = allowance_key(&sender, &caller);
  let mut allowance = ew::storage_load_big_int(&allowance_key);

  // amount should not exceed allowance
  if BigInt::compare(&amount, &allowance) > 0 {
    ew::signal_error();
    return;
  }

  // update allowance
  allowance -= &amount;
  ew::storage_store_big_int(&allowance_key, &allowance);

  perform_transfer(&sender, &recipient, amount);

  // return "true"
  ew::finish_i64(1); 
}

