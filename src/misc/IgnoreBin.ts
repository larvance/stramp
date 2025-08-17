import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import {OptionalBin} from "../OptionalBin";

class IgnoreBinConstructor extends Bin<undefined> implements OptionalBin {
    name = "Ignore";
    sample = <undefined>undefined;
    isOptional = true as const;

    unsafeWrite() {
    };

    read() {
        return undefined;
    };

    unsafeSize() {
        return 0;
    };

    findProblem() {
    };

    adapt() {
        return undefined;
    };
}

export default new IgnoreBinConstructor();