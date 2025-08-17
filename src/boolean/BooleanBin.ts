import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";

class BooleanBinConstructor extends Bin<boolean> {
    name = "bool";
    sample = false;

    unsafeWrite(bind: BufferIndex, value: boolean) {
        bind.push(+value);
    };

    read(bind: BufferIndex) {
        return Boolean(bind.shift());
    };

    unsafeSize() {
        return 1;
    };

    findProblem(value: unknown, _: unknown) {
        if (typeof value !== "boolean") return this.makeProblem("Expected a boolean");
    };

    adapt(value: unknown) {
        return Boolean(value);
    };
}

export default new BooleanBinConstructor();