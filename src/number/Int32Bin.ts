import {BufferIndex} from "../BufferIndex";
import IntBaseBin from "./base/IntBaseBin";

class Int32Bin extends IntBaseBin {
    name = "i32";

    min = -2147483648;
    max = 2147483647;
    bytes = 4;
    signed = true;

    unsafeWrite(bind: BufferIndex, value: number) {
        bind.writeInt32(value);
    };

    read(bind: BufferIndex) {
        return bind.readInt32();
    };
}

export default new Int32Bin();