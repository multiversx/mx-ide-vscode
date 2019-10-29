#include "elrond_sc.h"

// global data used in next function, will be allocated to WebAssembly memory
bytes32 zero_key[1] = {1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};
bytes32 addr[1] = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};

bytes32 some_bytes[1] = {1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};

void init() {
  loadOwner((i32ptr*)addr);
  int bi = bigIntNew(257);
  storageStoreAsBigInt((i32ptr*)addr, bi);

  loadCaller((i32ptr*)addr);
  storageStoreAsBytes((i32ptr*)zero_key[0], (i32ptr*)addr[0], 32);

  bigIntSetBytes(bi, (i32ptr*)some_bytes[0], (int32_t)7);
  debugPrintBigInt(bi);

  bigIntSub(bi, bi, bigIntNew(2));
  debugPrintBigInt(bi);
  int32_t bi_length = bigIntByteLength(bi);
  debugPrintInt32(bi_length);

  int32_t len = bigIntGetBytes(bi, (i32ptr*)some_bytes[0]);
  debugPrintInt32(len);
  debugPrintBytes((i32ptr*)some_bytes[0], len);

  loadCallValue(bi);
  returnBigInt(bi);
}

void topUp() {
  int bi = bigIntNew(17);
  loadArgumentAsBigInt(0, bi);
  debugPrintBigInt(bi);
  loadArgumentAsBigInt(1, bi);
  debugPrintBigInt(bi);
  loadArgumentAsBigInt(2, bi);
  debugPrintBigInt(bi);
  loadOwner((i32ptr*)addr);
  loadBalance((i32ptr*)addr, bi);
  storageLoadAsBigInt((i32ptr*)addr, bi);
  debugPrintBigInt(bi);

  storageLoadAsBytes((i32ptr*)zero_key[0], (i32ptr*)addr[0]);
  debugPrintBytes((i32ptr*)addr[0], 32);

  sendTransaction(getGasLeft(), (i32ptr*)addr[0], bigIntNew(3), (i32ptr*)addr[0], 2);

  long long i = bigIntGetInt64(bi);
  returnInt32((int32_t)i);
}

void do_balance() {

}

void transfer() {

}

// global data used in next function, will be allocated to WebAssembly memory
i32 selector[1] = {0};
void _main(void) {
}
