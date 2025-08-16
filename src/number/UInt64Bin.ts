import {BufferIndex} from "../BufferIndex";
import BigIntBaseBin from "./base/BigIntBaseBin";
import {Big0, BigMax} from "../Utils";

class UInt64BinConstructor extends BigIntBaseBin {
    name = "u64";

    min = Big0;
    max = BigMax;
    bytes = 8;

    unsafeWrite(bind: BufferIndex, value: bigint) {
        bind.writeUInt64(BigInt(value));
    };

    read(bind: BufferIndex) {
        return bind.readUInt64();
    };
}

export default new UInt64BinConstructor();