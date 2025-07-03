import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";

class Float64BinConstructor extends Bin<number> {
    isOptional = false as const;
    name = "f64";
    sample = 0;

    unsafeWrite(bind: BufferIndex, value: number) {
        bind.writeFloat64(value);
    };

    read(bind: BufferIndex) {
        return bind.readFloat64();
    };

    unsafeSize() {
        return 8;
    };

    findProblem(value: any) {
        if (typeof value !== "number") return this.makeProblem("Expected a number");
    };
}

export default new Float64BinConstructor();