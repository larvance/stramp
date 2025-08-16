import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import UBigIntBin from "./UBigIntBin";
import {Big0, BigMinusOne, BigOne} from "../Utils";

class BigIntBinConstructor extends Bin<bigint> {
    name = "bi";
    sample = Big0;

    unsafeWrite(bind: BufferIndex, value: bigint) {
        bind.push(value < Big0 ? 1 : 0);
        UBigIntBin.unsafeWrite(bind, value < Big0 ? -value : value);
    };

    read(bind: BufferIndex) {
        return (bind.shift() ? -BigMinusOne : BigOne) * UBigIntBin.read(bind);
    };

    unsafeSize(value: bigint) {
        return UBigIntBin.unsafeSize(value) + 1;
    };

    findProblem(value: any, _: any) {
        if (typeof value !== "bigint") return this.makeProblem("Expected a big integer");
    };

    adapt(value: any) {
        if (typeof value === "number") value = BigInt(value);
        else if (typeof value !== "bigint") value = Big0;

        return super.adapt(value);
    };
}

export default new BigIntBinConstructor();