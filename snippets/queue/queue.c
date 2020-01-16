#include "elrond/context.h"

byte orderNumberKey[32]             = {'o','r','d','e','r',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,'n','u','m'};
byte caller[32]                 = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};
byte participantKey[32]         = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};
byte participant[32]            = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};

void setParticipantKeyByIndex(i32 index);

void init() {
    int64storageStore(orderNumberKey, 0);
}

void addMe() {
    i64 orderNumber = int64storageLoad(orderNumberKey);
    setParticipantKeyByIndex(orderNumber);
    getCaller(caller);
    storageStore(participantKey, caller, 32);
    
    int64storageStore(orderNumberKey, ++orderNumber);
    finish("ok", 2);
}

void getAt() {
    i64 index = int64getArgument(0);
    setParticipantKeyByIndex(index);
    storageLoad(participantKey, participant);
    finish(participant, 32);
}

void getCount() {
    i64 counter = int64storageLoad(orderNumberKey);
    int64finish(counter);
}

void setParticipantKeyByIndex(i32 index) {
    participantKey[0] = (index >> 24) & 0xFF;
    participantKey[1] = (index >> 16) & 0xFF;
    participantKey[2] = (index >> 8) & 0xFF;
    participantKey[3] = index & 0xFF;
}