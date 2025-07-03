import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";

export class ConstantBinConstructor<T> extends Bin<T> {
    isOptional = true as const;

    constructor(
        public sample: T,
        public name: string = typeof sample === "bigint" ? sample.toString() : JSON.stringify(sample)
    ) {
        super();
    };

    unsafeWrite(bind: BufferIndex, value: T): void {
    };

    read(bind: BufferIndex): T {
        return this.sample;
    };

    unsafeSize(value: T): number {
        return 0;
    };

    findProblem(value: any, strict?: boolean) {
        if (strict) {
            if (typeof this.sample === "number" && isNaN(this.sample) && (typeof value !== "number" || !isNaN(value))) {
                return this.makeProblem(`Expected the constant value NaN`);
            } else if (value !== this.sample) return this.makeProblem(`Expected the constant value ${this.sample}`);
        }
    };

    new<K>(value: K, name = JSON.stringify(value)): ConstantBinConstructor<K> {
        return new ConstantBinConstructor<K>(value, name);
    };

    adapt() {
        return this.sample;
    };

    copy() {
        const o = super.copy();
        o.name = this.name;
        o.sample = this.sample;
        return o;
    };
}

export default new ConstantBinConstructor<"constant">("constant");