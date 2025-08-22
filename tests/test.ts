import X from "../src/Stramp";

class MyNumber {
    constructor(public readonly value: number) {
    }
}

const myStruct = X.u8.highway<MyNumber>(
    obj => obj.value,
    val => new MyNumber(val)
);

const myInstance = new MyNumber(1);

const buf = myStruct.serialize(myInstance);

console.log(buf); // <Buffer 01>

const myInstance2 = myStruct.parse(buf);

console.log(myInstance2); // MyNumber { value: 1 }
