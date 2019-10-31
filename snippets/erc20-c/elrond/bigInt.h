#include "types.h"

typedef unsigned int bigInt;

bigInt    bigIntNew(int value);

void      bigIntgetArgument(int argumentIndex, bigInt argument);

int       bigIntstorageLoad(byte *key, bigInt value);
int       bigIntstorageStore(byte *key, bigInt value);

void      bigIntAdd(bigInt destination, bigInt op1, bigInt op2);
void      bigIntSub(bigInt destination, bigInt op1, bigInt op2);
void      bigIntMul(bigInt destination, bigInt op1, bigInt op2);
int       bigIntCmp(bigInt op1, bigInt op2);

int       bigIntIsInt64(bigInt reference);
long long bigIntGetInt64(bigInt reference);
void      bigIntSetInt64(bigInt destination, long long value);

void      bigIntFinish(bigInt reference);
void      bigIntgetCallValue(bigInt destination);
void      bigIntgetExternalBalance(byte *address, bigInt result);

int       bigIntByteLength(bigInt reference);
int       bigIntGetBytes(bigInt reference, byte *byte);
void      bigIntSetBytes(bigInt destination, byte *byte, int byteLength);
