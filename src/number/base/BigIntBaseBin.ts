import {Bin} from "../../Bin";
import {Big0} from "../../Utils";

export default abstract class BigIntBaseBin extends Bin<bigint | number> {
    sample = Big0;

    abstract min: bigint;
    abstract max: bigint;
    abstract bytes: number;

    unsafeSize() {
        return this.bytes;
    };

    findProblem(value: unknown) {
        if (typeof value === "number") value = BigInt(value);
        if (typeof value !== "bigint") return this.makeProblem("Expected a big integer");
        if (value < this.min || value > this.max) return this.makeProblem(`Expected a number between ${this.min} and ${this.max}`);
    };

    adapt(value: unknown) {
        if (typeof value === "number") value = BigInt(value);
        if (typeof value !== "bigint") value = Big0;

        const v = value as bigint | number;

        return super.adapt(v > this.max ? this.max : (v < this.min ? this.min : v));
    };
}