
#![no_std]

#![allow(dead_code)]
#![allow(stable_features)]


// Required to replace the global allocator.
#![feature(global_allocator)]

#![feature(alloc_error_handler)]

// Required to use the `alloc` crate and its types, the `abort` intrinsic, and a
// custom panic handler.
#![feature(alloc, core_intrinsics, lang_items)]

mod ext;
mod ext_int64;
mod big_int;
mod address;

pub use ext::*;
pub use ext_int64::*;
pub use big_int::*;
pub use address::*;

use core::panic::PanicInfo;

#[macro_use]
extern crate alloc;
extern crate wee_alloc;

// Use `wee_alloc` as the global allocator.
// more info: https://os.phil-opp.com/heap-allocation/#local-and-static-variables
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[alloc_error_handler]
fn alloc_error_handler(_layout: alloc::alloc::Layout) -> ! {
    loop {}
    //panic!("allocation error: {:?}", layout)
}

// Need to provide a tiny `panic_fmt` lang-item implementation for `#![no_std]`.
// This implementation will translate panics into traps in the resulting
// WebAssembly.
// #[lang = "panic_fmt"]
// extern "C" fn panic_fmt(
//     _args: ::core::fmt::Arguments,
//     _file: &'static str,
//     _line: u32
// ) -> ! {
//     use core::intrinsics;
//     unsafe {
//         intrinsics::abort();
//     }
// }

// And now you can use `alloc` types!
pub use alloc::boxed::Box;
pub use alloc::vec::Vec;

extern {
    fn signalError() -> !;
}

#[panic_handler]
fn panic_fmt(_info: &PanicInfo) -> ! {
    unsafe {
        signalError();
    }
}
