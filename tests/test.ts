import * as X from "../src/Stramp";

// Note that the keyTyped only accepts a string bin
const myType = X.object.keyTyped(X.string8).valueTyped(X.u8);

const myObject = {
    a: 10,
    b: 20,
    c: 30
};

const buffer = myType.serialize(myObject);

// The first 4 bytes are the size of the object, you can change it like this:  .lengthBytes(X.u8)
console.log(buffer); // <Buffer 03 00 00 00 01 61 0a 01 62 14 01 63 1e>

const restoredObject = myType.deserialize(buffer);

console.log(restoredObject); // Will have the same values as myObject