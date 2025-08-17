import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import UBigIntBin from "./UBigIntBin";
import {Big0, BigMinusOne} from "../Utils";

class NegBigIntBinConstructor extends Bin<bigint> {
    name = "nbi";
    sample = -BigMinusOne;

    unsafeWrite(bind: BufferIndex, value: bigint) {
        UBigIntBin.unsafeWrite(bind, -value);
    };

    read(bind: BufferIndex) {
        return -UBigIntBin.read(bind);
    };

    unsafeSize(value: bigint) {
        return UBigIntBin.unsafeSize(-value);
    };

    findProblem(value: unknown) {
        if (typeof value === "number") value = BigInt(value);
        if (typeof value !== "bigint") return this.makeProblem("Expected a big integer");
        if (value > Big0) return this.makeProblem("Expected a non-positive big integer");
    };

    adapt(value: unknown) {
        if (typeof value === "number") value = BigInt(value);
        else if (typeof value !== "bigint") value = Big0;
        const v = value as bigint;
        return super.adapt(v > Big0 ? -v : v);
    };
}

export default new NegBigIntBinConstructor();