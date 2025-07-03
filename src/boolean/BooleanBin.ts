import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";

class BooleanBinConstructor extends Bin<boolean> {
    name = "bool";
    sample = false;
    isOptional = false as const;

    unsafeWrite(bind: BufferIndex, value: boolean) {
        bind.push(+value);
    };

    read(bind: BufferIndex) {
        return Boolean(bind.shift());
    };

    unsafeSize() {
        return 1;
    };

    findProblem(value: any, _: any) {
        if (typeof value !== "boolean") return this.makeProblem("Expected a boolean");
    };

    adapt(value: any) {
        return Boolean(value);
    };
}

export default new BooleanBinConstructor();