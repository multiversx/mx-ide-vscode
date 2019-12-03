

// to avoid includes from libc, just hard-code things
typedef unsigned char uint8_t;
typedef int int32_t;
typedef int uint32_t;
typedef unsigned long long uint64_t;

// types used for Ethereum stuff
typedef uint8_t* bytes; // an array of bytes with unrestricted length
typedef uint8_t bytes32[32]; // an array of 32 bytes
typedef uint8_t address[32]; // an array of 32 bytes
typedef unsigned __int128 u128; // a 128 bit number, represented as a 16 bytes long little endian unsigned integer in memory
//typedef uint256_t u256; // a 256 bit number, represented as a 32 bytes long little endian unsigned integer in memory
typedef uint32_t i32; // same as i32 in WebAssembly
typedef uint32_t i32ptr; // same as i32 in WebAssembly, but treated as a pointer to a WebAssembly memory offset
typedef uint64_t i64; // same as i64 in WebAssembly

// elrond api functions
int32_t loadFunctionName(i32ptr* functionOffset);
int32_t getNumArguments();
void loadArgumentAsBigInt(int32_t id, int32_t destination);
int32_t loadArgumentAsBytes(int32_t id, i32ptr* argOffset);
long long getArgumentAsInt64(int32_t id);

void loadOwner(i32ptr* resultOffset);
void loadCaller(i32ptr* resultOffset);
void loadCallValue(int32_t destination);
void loadBalance(i32ptr* addressOffset, int32_t result);
long long getGasLeft();
int32_t loadBlockHash(long long nonce, i32ptr* resultOffset);
long long getBlockTimestamp();

int32_t sendTransaction(long long gasLimit, i32ptr* dstOffset, int32_t valueRef, i32ptr* dataOffset, int32_t dataLength);

int32_t storageStoreAsBytes(i32ptr* keyOffset, i32ptr* dataOffset, int32_t dataLength);
int32_t storageLoadAsBytes(i32ptr* keyOffset, i32ptr* dataOffset);
int32_t storageStoreAsBigInt(i32ptr* keyOffset, int32_t source);
int32_t storageLoadAsBigInt(i32ptr* keyOffset, int32_t destination);
int32_t storageStoreAsInt64(i32ptr* keyOffset, long long value);
long long storageLoadAsInt64(i32ptr* keyOffset);

void returnBigInt(int32_t reference);
void returnInt32(int32_t value);
void writeLog(int32_t pointer, int32_t length, int32_t topicPtr, int32_t numTopics);
void signalError();

int32_t bigIntNew(int32_t smallValue);
int32_t bigIntByteLength(int32_t reference);
int32_t bigIntGetBytes(int32_t reference, i32ptr* byteOffset);
void bigIntSetBytes(int32_t destination, i32ptr* byteOffset, int32_t byteLength);
int32_t bigIntIsInt64(int32_t reference);
long long bigIntGetInt64(int32_t reference);
void bigIntSetInt64(int32_t destination, long long value);
void bigIntAdd(int32_t destination, int32_t op1, int32_t op2);
void bigIntSub(int32_t destination, int32_t op1, int32_t op2);
void bigIntMul(int32_t destination, int32_t op1, int32_t op2);
int32_t bigIntCmp(int32_t op1, int32_t op2);

void logMessage(i32ptr* pointer, int32_t length);
void debugPrintBigInt(int32_t value);
void debugPrintInt32(int32_t value);
void debugPrintBytes(i32ptr* byteOffset, int32_t byteLength);
void debugPrintString(i32ptr* byteOffset, int32_t byteLength);


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
