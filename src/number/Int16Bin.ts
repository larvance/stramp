import {BufferIndex} from "../BufferIndex";
import IntBaseBin from "./base/IntBaseBin";

class Int16BinConstructor extends IntBaseBin {
    name = "i16";

    min = -32768;
    max = 32767;
    bytes = 2;
    signed = true;

    unsafeWrite(bind: BufferIndex, value: number) {
        bind.writeInt16(value);
    };

    read(bind: BufferIndex) {
        return bind.readInt16();
    };
}

export default new Int16BinConstructor();