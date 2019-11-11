#![no_main]

// NOT YET EVER RUN

type bigIntHandle = i32;

const TOTAL_SUPPLY_KEY: i32 = 1;
const BALANCE_PREFIX: i32 = 2;

extern {
    fn error(errcode: i32);
    fn getNumArguments() -> bigIntHandle;
    fn getBigIntArgument(i32 index) -> bigIntHandle;
    fn storageStore(key: bigIntHandle, value: bigIntHandle);
    fn storageLoad(key: bigIntHandle) -> value;
    fn newBigInt(val: i64) -> bigIntHandle;
    fn concatBigInt(op1: bigIntHandle, op2: bigIntHandle);
    fn addBigInt(dest: bigIntHandle, op1: bigIntHandle, op2: bigIntHandle);
    fn subBigInt(dest: bigIntHandle, op1: bigIntHandle, op2: bigIntHandle);
    fn cmpBigInt(op1: bigIntHandle, op2: bigIntHandle) -> i32;
}

fn getBalance(address: bigIntHandle) -> bigIntHandle {
    return storageLoad(concatBigInt(newBigInt(BALANCE_PREFIX), address));
}

fn saveBalance(address: bigIntHandle, bal: bigIntHandle) {
    storageStore(concatBigInt(newBigInt(BALANCE_PREFIX), address), bal);
}

#[no_mangle]
pub extern fn init() {
    if getNumArguments() != 2 {
        error(1)
        return;
    }
    let initialOwner = getBigIntArgument(0);
    let totalSupply = getBigIntArgument(1);
    saveBalance(initialOwner, totalSupply)
}

#[no_mangle]
pub extern fn transfer() -> i32 {
    if getNumArguments() != 3 {
        error(1)
        return;
    }

    let sender = getBigIntArgument(0);
    let receiver = getBigIntArgument(1);
    let amount = getBigIntArgument(2);

    let senderBalance = getBalance(sender);
    if cmpBigInt(amount, senderBalance) > 0 {
        error(2);
        return;
    }
    subBigInt(senderBalance, senderBalance, amount)
    let receiverBalance = getBalance(sender);
    addBigInt(receiverBalance, receiverBalance, amount)
    saveBalance(sender, senderBalance)
    saveBalance(receiver, receiverBalance)
}