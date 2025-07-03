import {Bin, getBinByInternalId} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import Stramp from "../Stramp";

class NumberBinConstructor extends Bin<number> {
    isOptional = false as const;
    name = "number";
    sample = 0;
    #minValue = -Infinity;
    #maxValue = Infinity;

    unsafeWrite(bind: BufferIndex, value: number) {
        const type = Stramp.getNumberTypeOf(value);
        bind.push(type.internalId);
        type.unsafeWrite(bind, value);
    };

    read(bind: BufferIndex) {
        const type = getBinByInternalId(bind.shift());
        return type.read(bind);
    };

    unsafeSize(value: number) {
        return Stramp.getNumberTypeOf(value).unsafeSize(0) + 1;
    };

    findProblem(value: any) {
        if (typeof value !== "number") return this.makeProblem("Not a number", value);

        if (value < this.#minValue || value > this.#maxValue) return this.makeProblem(`Expected a number between ${this.#minValue} and ${this.#maxValue}`);
    };

    min(value: number) {
        const o = this.copy();
        o.#minValue = value;
        return o;
    };

    max(value: number) {
        const o = this.copy();
        o.#maxValue = value;
        return o;
    };
}

export default new NumberBinConstructor();