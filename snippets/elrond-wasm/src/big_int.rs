

use core::ops::Add;
use core::ops::AddAssign;
use core::ops::Sub;
use core::ops::SubAssign;
use core::ops::Mul;
use core::ops::MulAssign;

use alloc::vec::Vec;

use crate::address::StorageKey;

extern {
    fn bigIntNew(value: i64) -> i32;

    fn bigIntByteLength(x: i32) -> i32;
    fn bigIntGetBytes(reference: i32, byte_ptr: *mut u8) -> i32;
    fn bigIntSetBytes(destination: i32, byte_ptr: *const u8, byte_len: i32);

    fn bigIntAdd(dest: i32, x: i32, y: i32);
    fn bigIntSub(dest: i32, x: i32, y: i32);
    fn bigIntMul(dest: i32, x: i32, y: i32);
    fn bigIntCmp(x: i32, y: i32) -> i32;

    fn bigIntStorageStore(key_ptr: *const u8, source: i32) -> i32;
    fn bigIntStorageLoad(key_ptr: *const u8, destination: i32) -> i32;
    
    fn bigIntGetSignedArgument(arg_id: i32, dest: i32);
    fn bigIntGetCallValue(dest: i32);
    fn bigIntFinish(bih: i32);
}

pub struct BigInt {
    handle: i32
}

impl From<i64> for BigInt {
    fn from(item: i64) -> Self {
        unsafe {
            BigInt{ handle: bigIntNew(item) }
        }
    }
}

impl BigInt {
    pub fn from_i64(value: i64) -> BigInt {
        unsafe {
            BigInt{ handle: bigIntNew(value) }
        }
    }

    pub fn byte_length(&self) -> i32 {
        unsafe { bigIntByteLength(self.handle) }
    }

    pub fn copy_to_slice(&self, slice: &mut [u8]) -> i32 {
        unsafe {
            let byte_len = bigIntGetBytes(self.handle, slice.as_mut_ptr());
            byte_len
        }
    }

    pub fn get_bytes_big_endian(&self) -> Vec<u8> {
        unsafe {
            let byte_len = bigIntByteLength(self.handle);
            let mut vec = vec![0u8; byte_len as usize];
            bigIntGetBytes(self.handle, vec.as_mut_ptr());
            vec
        }
    }

    pub fn get_bytes_big_endian_pad_right(&self, nr_bytes: usize) -> Vec<u8> {
        unsafe {
            let byte_len = bigIntByteLength(self.handle) as usize;
            if byte_len > nr_bytes {
                panic!();
            }
            let mut vec = vec![0u8; nr_bytes];
            if byte_len > 0 {
                bigIntGetBytes(self.handle, &mut vec[nr_bytes - byte_len]);
            }
            vec
        }
    }
}

impl Add for BigInt {
    type Output = BigInt;

    fn add(self, other: BigInt) -> BigInt {
        unsafe {
            let result = bigIntNew(0);
            bigIntAdd(result, self.handle, other.handle);
            BigInt {handle: result}
        }
    }
}

impl AddAssign<BigInt> for BigInt {
    fn add_assign(&mut self, other: Self) {
        unsafe {
            bigIntAdd(self.handle, self.handle, other.handle);
        }
    }
}

impl AddAssign<&BigInt> for BigInt {
    fn add_assign(&mut self, other: &BigInt) {
        unsafe {
            bigIntAdd(self.handle, self.handle, other.handle);
        }
    }
}

impl Sub for BigInt {
    type Output = BigInt;

    fn sub(self, other: BigInt) -> BigInt {
        unsafe {
            let result = bigIntNew(0);
            bigIntSub(result, self.handle, other.handle);
            BigInt {handle: result}
        }
    }
}

impl SubAssign<BigInt> for BigInt {
    fn sub_assign(&mut self, other: Self) {
        unsafe {
            bigIntSub(self.handle, self.handle, other.handle);
        }
    }
}

impl SubAssign<&BigInt> for BigInt {
    fn sub_assign(&mut self, other: &BigInt) {
        unsafe {
            bigIntSub(self.handle, self.handle, other.handle);
        }
    }
}

impl Mul for BigInt {
    type Output = BigInt;

    fn mul(self, other: BigInt) -> BigInt {
        unsafe {
            let result = bigIntNew(0);
            bigIntMul(result, self.handle, other.handle);
            BigInt {handle: result}
        }
    }
}

impl MulAssign for BigInt {
    fn mul_assign(&mut self, other: Self) {
        unsafe {
            bigIntMul(self.handle, self.handle, other.handle);
        }
    }
}

impl BigInt {
    pub fn compare(b1: &BigInt, b2: &BigInt) -> i32 {
        unsafe {
            bigIntCmp(b1.handle, b2.handle)
        }
    }
}

pub fn storage_store_big_int(key: &StorageKey, value: &BigInt) {
    unsafe {
        bigIntStorageStore(key.as_ref().as_ptr(), value.handle);
    }
}

pub fn storage_load_big_int(key: &StorageKey) -> BigInt {
    unsafe {
        let result = bigIntNew(0);
        bigIntStorageLoad(key.as_ref().as_ptr(), result);
        BigInt {handle: result}
    }
}

pub fn get_argument_big_int(arg_id: i32) -> BigInt {
    unsafe {
        let result = bigIntNew(0);
        bigIntGetSignedArgument(arg_id, result);
        BigInt {handle: result}
    }
}

pub fn get_call_value_big_int() -> BigInt {
    unsafe {
        let result = bigIntNew(0);
        bigIntGetCallValue(result);
        BigInt {handle: result}
    }
}

pub fn finish_big_int(b: BigInt) {
    unsafe {
        bigIntFinish(b.handle);
    }
}
