import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";

class IgnoreBinConstructor extends Bin<undefined> {
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