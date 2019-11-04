#![no_main]

extern {
    fn getNumArguments() -> i32;
    fn bigInsert(value: i32) -> i32;
    fn bigAdd(dest: i32, x: i32, y: i32);
    fn debugPrintBig(bih: i32);
}

// rustc dummy.rs --target=wasm32-unknown-unknown
// cargo build --target=wasm32-unknown-unknown
// ~/go/src/github.com/ElrondNetwork/elrond-go-node-debug/cmd/simple/simple "dummy.wasm" dummy5 1 2

// lldb-8 -- ~/go/src/github.com/ElrondNetwork/elrond-go-node-debug/cmd/simple/simple "/home/andreim/elrond/scui/example-rust/target/wasm32-unknown-unknown/debug/example-rust.wasm" dummy5 1 2
// lldb-8 -- ~/go/src/github.com/ElrondNetwork/elrond-go-node-debug/cmd/simple/simple "/home/andreim/elrond/scui/example-rust/src/main.wasm" dummy5 1 2
// lldb-8 -- wasmtime "/home/andreim/elrond/scui/example-rust/target/wasm32-unknown-unknown/debug/example-rust.wasm" dummy5 1 2

//int32_t getNumArguments();

#[no_mangle]
pub extern fn dummy5() -> i32 {
    5
}

#[no_mangle]
pub extern fn dummy6() -> i32 {
    unsafe {
        5 + getNumArguments()
    }
}

#[no_mangle]
pub extern fn dummy7() {
    unsafe {
        let x = bigInsert(123);
        let y = bigInsert(2);
        let z = bigInsert(0);
        bigAdd(z, x, y);
        debugPrintBig(z);
        
    }
}