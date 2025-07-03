import {BufferIndex} from "../BufferIndex";
import IntBaseBin from "./base/IntBaseBin";

class UInt8BinConstructor extends IntBaseBin {
    name = "u8";

    min = 0;
    max = 255;
    bytes = 1;
    signed = false;

    unsafeWrite(bind: BufferIndex, value: number) {
        bind.writeUInt8(value);
    };

    read(bind: BufferIndex) {
        return bind.readUInt8();
    };
}

export default new UInt8BinConstructor();