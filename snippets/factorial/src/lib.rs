
#![no_std]
#![no_main]
#![allow(non_snake_case)]
#![allow(unused_attributes)]

#[elrond_wasm_derive::contract]
pub trait Factorial {

    fn init(&self) {
    }

    fn factorial(&self, value: BI) -> BI {
        let mut result = BI::from(1);
        let one = BI::from(1);
        let mut x = BI::from(1);
        while &x <= &value {
            result *= &x;
            x += &one;
        }

        result
    }
}
