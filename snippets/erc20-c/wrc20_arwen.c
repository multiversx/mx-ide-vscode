#include "elrond/context.h"
#include "elrond/bigInt.h"

// global data used in next function, will be allocated to WebAssembly memory
byte sender[32]    = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};
byte recipient[32] = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};
byte subject[32]   = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};

void init() {
  if (getNumArguments() != 1) {
    signalError();
    return;
  }

  getCaller(sender);
  bigInt totalAmount = bigIntNew(0);
  bigIntgetArgument(0, totalAmount);

  bigIntstorageStore(sender, totalAmount);
}

void do_balance() {
  if (getNumArguments() != 1) {
    signalError();
    return;
  }

  getArgument(0, subject);
  
  bigInt balance = bigIntNew(0);
  bigIntstorageLoad(subject, balance);

  bigIntFinish(balance);
}

void transfer_token() {
  if (getNumArguments() != 2) {
    signalError();
    return;
  }

  getCaller(sender);
  getArgument(0, recipient);

  bigInt amount = bigIntNew(0);
  bigIntgetArgument(1, amount);

  bigInt senderBalance = bigIntNew(0);
  bigIntstorageLoad(sender, senderBalance);

  if (bigIntCmp(amount, senderBalance) > 0) {
    signalError();
    return;
  }

  bigIntSub(senderBalance, senderBalance, amount);
  bigIntstorageStore(sender, senderBalance);

  bigInt receiverBalance = bigIntNew(0);
  bigIntstorageLoad(recipient, receiverBalance);
  bigIntAdd(receiverBalance, receiverBalance, amount);
  bigIntstorageStore(recipient, receiverBalance);
}

// global data used in next function, will be allocated to WebAssembly memory
i32 selector[1] = {0};
void _main(void) {
}
