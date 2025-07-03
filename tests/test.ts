import * as X from "../src/Stramp";

const A = X.u8; // or any other Bin
const B = X.string8; // or any other Bin

const AorB = X.any.of(A, B); // Creates a Bin that can hold either u8 or string8
AorB.serialize("hello!");
AorB.serialize(10);

const defaultedU8 = A.default(0); // Creates a Bin that defaults to 0 if the value is undefined
const usefulObject = X.object.struct({
    myNumber: defaultedU8
});
const buf = usefulObject.serialize({}); // This works!