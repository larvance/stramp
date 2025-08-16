import X from "../src/Stramp";

class MyStruct {
    @X.def(X.u8) a = 155;

    b: number; // This is not a part of the structure, so it won't be saved/loaded.

    constructor(b = 10) {
        this.b = b;
    };

    log() {
        console.log(this.a * this.b);
    };
}

const struct1 = new MyStruct();

const buffer = X.save(struct1);

console.log(buffer);

const struct2 = new MyStruct();

X.load(struct2, buffer);

console.log(struct2);

struct2.log();
