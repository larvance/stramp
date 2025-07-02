import {Bin} from "../../Bin";

class NegativeInfinityBin extends Bin<number> {
    name = "-inf";
    sample = -Infinity;

    unsafeWrite() {
    };

    read() {
        return -Infinity;
    };

    unsafeSize() {
        return 0;
    };

    findProblem(value: any, strict = false) {
        if (strict && value !== -Infinity) return this.makeProblem("Expected -Infinity");
    };

    adapt() {
        return -Infinity;
    };
}

export default new NegativeInfinityBin();