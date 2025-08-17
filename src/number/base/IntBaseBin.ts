import {Bin} from "../../Bin";

export default abstract class IntBaseBin extends Bin<number> {
    sample = 0;

    abstract min: number;
    abstract max: number;
    abstract bytes: number;
    abstract signed: boolean;

    unsafeSize() {
        return this.bytes;
    };

    findProblem(value: unknown) {
        if (typeof value !== "number") return this.makeProblem("Expected a number");
        if (!Number.isInteger(value)) return this.makeProblem("Expected an integer");
        if (value < this.min || value > this.max) return this.makeProblem(`Expected a number between ${this.min} and ${this.max}`);
    };

    adapt(value: unknown) {
        if (typeof value === "string" || typeof value === "bigint") value = Number(value);
        else if (typeof value !== "number") value = 0;
        let v = +value;
        if (isNaN(v)) v = this.sample;
        if (v > this.max) v = this.max;
        if (v < this.min) v = this.min;
        if (this.signed !== (Math.sign(v) === -1)) v *= -1;
        if (!Number.isInteger(v)) v = Math.round(v);

        return super.adapt(v);
    };
}