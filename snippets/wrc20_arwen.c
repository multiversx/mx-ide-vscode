#include "elrond_sc.h"

// global data used in next function, will be allocated to WebAssembly memory
bytes32 sender[1] = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};
bytes32 recipient[1] = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};
bytes32 subject[1] = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};

void init() {
  if (getNumArguments() != 1) {
    signalError();
    return;
  }

  getCaller((i32ptr*)sender);
  int32_t totalAmount = bigIntNew(0);
  bigIntgetArgument(0, totalAmount);

  bigIntstorageStore((i32ptr*)sender, totalAmount);
}

void do_balance() {
  if (getNumArguments() != 1) {
    signalError();
    return;
  }

  getArgument(0, (i32ptr*)subject);
  
  int32_t balance = bigIntNew(0);
  bigIntstorageLoad((i32ptr*)subject, balance);

  bigIntFinish(balance);
}

void transfer_token() {
  if (getNumArguments() != 2) {
    signalError();
    return;
  }

  getCaller((i32ptr*)sender);
  getArgument(0, (i32ptr*)recipient);

  int32_t amount = bigIntNew(0);
  bigIntgetArgument(1, amount);

  int32_t senderBalance = bigIntNew(0);
  bigIntstorageLoad((i32ptr*)sender, senderBalance);

  if (bigIntCmp(amount, senderBalance) > 0) {
    signalError();
    return;
  }

  bigIntSub(senderBalance, senderBalance, amount);
  bigIntstorageStore((i32ptr*)sender, senderBalance);

  int32_t receiverBalance = bigIntNew(0);
  bigIntstorageLoad((i32ptr*)recipient, receiverBalance);
  bigIntAdd(receiverBalance, receiverBalance, amount);
  bigIntstorageStore((i32ptr*)recipient, receiverBalance);
}

// global data used in next function, will be allocated to WebAssembly memory
i32 selector[1] = {0};
void _main(void) {
}