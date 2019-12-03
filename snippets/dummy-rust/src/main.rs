
#![no_std]
#![no_main]

extern crate elrond_wasm;

use elrond_wasm as ew;
use elrond_wasm::BigInt;

use elrond_wasm::Vec;

extern {
    fn getNumArguments() -> i32;
    fn bigIntNew(value: i64) -> i32;
    fn bigIntAdd(dest: i32, x: i32, y: i32);
    fn bigIntFinish(bih: i32);
    fn getOwner(callerAddress: *mut u8);
    fn signalError();
    fn finish(dataPtr: *const u8, dataLen: i32);
}


// rustc dummy.rs --target=wasm32-unknown-unknown
// cargo build --target=wasm32-unknown-unknown
// ~/go/src/github.com/ElrondNetwork/elrond-go-node-debug/cmd/simple/simple "dummy.wasm" dummy5 1 2

// ~/go/src/github.com/ElrondNetwork/arwen-wasm-vm/cmd/test/test /home/andreim/elrond/scui/sc-examples/dummy-rust/test/dummy.json

// lldb-8 -- ~/go/src/github.com/ElrondNetwork/elrond-go-node-debug/cmd/simple/simple "/home/andreim/elrond/scui/example-rust/target/wasm32-unknown-unknown/debug/example-rust.wasm" dummy5 1 2
// lldb-8 -- ~/go/src/github.com/ElrondNetwork/elrond-go-node-debug/cmd/simple/simple "/home/andreim/elrond/scui/example-rust/src/main.wasm" dummy5 1 2
// lldb-8 -- wasmtime "/home/andreim/elrond/scui/example-rust/target/wasm32-unknown-unknown/debug/example-rust.wasm" dummy5 1 2

//int32_t getNumArguments();

#[no_mangle]
pub extern fn dummy1() {
    let x = BigInt::from_i64(260);
    let vec1: Vec<u8> = x.get_bytes_big_endian_pad_right(10);
    for i in vec1.iter() {
        ew::finish_i64(*i as i64);
    }
}

#[no_mangle]
pub extern fn dummy10() {
    let x = BigInt::from_i64(5);
    let y = BigInt::from_i64(7);
    let mut z = x + y;
    z += BigInt::from_i64(1024);
    ew::finish_big_int(z);
}

#[no_mangle]
pub extern fn dummy2() {
    let res: [u8; 32] = [9; 32];
        
    unsafe {
        finish(&res[0], 32);
    }
}

#[no_mangle]
pub extern fn dummy5() -> i32 {
    unsafe {
        55 + getNumArguments()
    }
}

#[no_mangle]
pub extern fn dummy6() {
    unsafe {
        let mut owner: [u8; 32] = [0; 32];
        getOwner(&mut owner[0]);
        signalError(); 
        let res: [u8; 32] = [9; 32];
        finish(&res[0], 32);
    }
}

#[no_mangle]
pub extern fn dummy7() {
    unsafe {
        let x = bigIntNew(123);
        let y = bigIntNew(2);
        let z = bigIntNew(0);
        bigIntAdd(z, x, y);
        bigIntFinish(z);
    }
}