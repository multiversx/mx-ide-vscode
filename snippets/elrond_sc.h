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
void getOwner(i32ptr* resultOffset);
void getExternalBalance(i32ptr* addressOffset, i32ptr* resultOffset);
int32_t getBlockHash(long long nonce, i32ptr* resultOffset);
int32_t transfer(long long gasLimit, i32ptr* dstOffset, i32ptr* sndOffset, i32ptr* valueOffset, i32ptr* dataOffset, int32_t length);
int32_t getArgument(int32_t id, i32ptr* argOffset);
int32_t getFunction(i32ptr* functionOffset);
int32_t getNumArguments();
int32_t storageStore(i32ptr* keyOffset, i32ptr* dataOffset, int32_t dataLength);
int32_t storageLoad(i32ptr* keyOffset, i32ptr* dataOffset);
void getCaller(i32ptr* resultOffset);
int32_t getCallValue(i32ptr* resultOffset);
void writeLog(i32ptr* pointer, int32_t length, i32ptr* topicPtr, int32_t numTopics);
void finish(i32ptr* dataOffset, int32_t length);
void signalError();
long long getGasLeft();
long long getBlockTimestamp();

long long int64getArgument(int32_t id);
int32_t int64storageStore(i32ptr* keyOffset, long long value);
long long int64storageLoad(i32ptr* keyOffset);
void int64finish(long long value);

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
void bigIntFinish(int32_t reference);
int32_t bigIntstorageStore(i32ptr* keyOffset, int32_t source);
int32_t bigIntstorageLoad(i32ptr* keyOffset, int32_t destination);
void bigIntgetArgument(int32_t id, int32_t destination);
void bigIntgetCallValue(int32_t destination);
void bigIntgetExternalBalance(i32ptr* addressOffset, int32_t result);