
use crate::address::Address;

const ADDRESS_LENGTH: usize = 32;
const KEY_LENGTH: usize = 32;
const TOPIC_LENGTH: usize = 32;

extern {
    fn getOwner(resultOffset: *mut u8);
    fn blockHash(nonce: i64, resultOffset: *mut u8) -> i32;
    fn transferValue(gasLimit: i64, dstOffset: *mut u8, sndOffset: *const u8, valueOffset: *const u8, dataOffset: *const u8, length: i32) -> i32;
    fn getNumArguments() -> i32;
    fn getArgument(id: i32, dstOffset: *mut u8) -> i32;
    fn getFunction(functionOffset: *const u8) -> i32;
    fn storageStore(keyOffset: *const u8, dataOffset: *const u8, dataLength: i32);
    fn storageLoad(keyOffset: *const u8, dataOffset: *mut u8) -> i32;

    fn getCaller(resultOffset: *mut u8);
    fn callValue(resultOffset: *const u8) -> i32;
    fn writeLog(pointer: *const u8, length: i32, topicPtr: *const u8, numTopics: i32);
    fn returnData(dataOffset: *const u8, length: i32);
    fn signalError();

    fn getGasLeft() -> i64;
    fn getBlockTimestamp() -> i64;
    fn getBlockNonce() -> i64;
    fn getBlockRound() -> i64;
    fn getBlockEpoch() -> i64;
    fn getBlockRandomSeed(resultOffset: *mut u8);
    fn getStateRootHash(resultOffset: *mut u8);
    fn getPrevBlockTimestamp() -> i64;
    fn getPrevBlockNonce() -> i64;
    fn getPrevBlockRound() -> i64;
    fn getPrevBlockEpoch() -> i64;
    fn getPrevBlockRandomSeed(resultOffset: *const u8);
}

pub fn get_owner() -> Address {
    unsafe {
        let mut res = [0u8; 32];
        getOwner(res.as_mut_ptr());
        res.into()
    }
}

pub fn get_caller() -> Address {
    unsafe {
        let mut res = [0u8; 32];
        getCaller(res.as_mut_ptr());
        res.into()
    }
}

pub fn get_num_arguments() -> i32 {
    unsafe { getNumArguments() }
}

pub fn get_argument_bytes32(ard_index: i32) -> [u8; 32] {
    unsafe {
        let mut res = [0u8; 32];
        getArgument(ard_index, res.as_mut_ptr());
        res
    }
}

pub fn get_argument_address(ard_index: i32) -> Address {
    unsafe {
        let mut res = [0u8; 32];
        getArgument(ard_index, res.as_mut_ptr());
        res.into()
    }
}

pub fn signal_error() {
    unsafe { signalError() }
}

pub fn write_log(topics: &[[u8;32]], data: &[u8]) {
    let mut topics_raw = [0u8; TOPIC_LENGTH * 10]; // hopefully we never have more than 10 topics
    for i in 0..topics.len() {
        topics_raw[TOPIC_LENGTH*i..TOPIC_LENGTH*(i+1)].copy_from_slice(&topics[i]);
    }
    unsafe {
        writeLog(data.as_ptr(), data.len() as i32, topics_raw.as_ptr(), topics.len() as i32);
    }
}
