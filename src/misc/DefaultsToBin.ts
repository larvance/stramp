import {BufferIndex} from "../BufferIndex";
import {Bin} from "../Bin";

export class DefaultsToBin<T> extends Bin<T> {
    name: string;
    readonly sampleSize: number;
    isOptional = true as const;

    constructor(public base: Bin<T>, public readonly sample: T) {
        super();
        this.name = (base.name.includes(" ") ? `(${base.name})` : base.name) + `(${sample})`;
        this.sampleSize = this.base.unsafeSize(sample);
    };

    unsafeWrite(bind: BufferIndex, value: any) {
        this.base.unsafeWrite(bind, value === undefined ? this.sample : value);
    };

    read(bind: BufferIndex) {
        return this.base.read(bind);
    };

    unsafeSize(value: any) {
        return value === undefined ? this.sampleSize : this.base.unsafeSize(value);
    };

    findProblem(value: any, strict?: any) {
        if (value === undefined) return;
        return this.base.findProblem(value, strict);
    };

    adapt(value: any) {
        if (value === undefined) return value;
        return this.base.adapt(value);
    };
}