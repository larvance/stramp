import {BufferIndex} from "../BufferIndex";
import BigIntBaseBin from "./base/BigIntBaseBin";
import {BigMax, BigMin} from "../Utils";

class Int64BinConstructor extends BigIntBaseBin {
    name = "i64";

    min = BigMin;
    max = BigMax;
    bytes = 8;

    unsafeWrite(bind: BufferIndex, value: bigint) {
        bind.writeInt64(BigInt(value));
    };

    read(bind: BufferIndex) {
        return bind.readInt64();
    };
}

export default new Int64BinConstructor();