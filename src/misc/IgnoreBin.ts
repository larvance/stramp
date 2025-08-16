import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import {OptionalBin} from "../OptionalBin";

class IgnoreBinConstructor extends Bin<undefined> implements OptionalBin {
    name = "Ignore";
    sample = <undefined>undefined;
    isOptional = true as const;

    unsafeWrite(_: BufferIndex, __: any) {
    };

    read(_: BufferIndex) {
        return undefined;
    };

    unsafeSize(_: any) {
        return 0;
    };

    findProblem(_: any, __?: any) {
    };

    adapt() {
        return undefined;
    };
}

export default new IgnoreBinConstructor();