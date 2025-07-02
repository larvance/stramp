import {BufferIndex} from "../BufferIndex";
import IntBaseBin from "./base/IntBaseBin";

class Int8Bin extends IntBaseBin {
    name = "i8";

    min = -128;
    max = 127;
    bytes = 1;
    signed = true;

    unsafeWrite(bind: BufferIndex, value: number) {
        bind.writeInt8(value);
    };

    read(bind: BufferIndex) {
        return bind.readInt8();
    };
}

export default new Int8Bin();