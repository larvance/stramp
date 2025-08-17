import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import {OptionalBin} from "../OptionalBin";

export class HighwayBin<Input, Output> extends Bin<Output> {
    constructor(
        public bin: Bin<Input>,
        public input: (obj: Output) => Input,
        public output: (obj: Input) => Output,
        public name = `Highway<${bin.name}>`,
        public sample = output(bin.sample),
        public adaptor: (v: unknown) => Output = v => v as Output // "trust me bro"
    ) {
        super();
    };

    unsafeWrite(bind: BufferIndex, value: Output) {
        this.bin.unsafeWrite(bind, this.input(value));
    };

    read(bind: BufferIndex) {
        return this.output(this.bin.read(bind));
    };

    unsafeSize(value: Output) {
        return this.bin.unsafeSize(this.input(value));
    };

    findProblem(value: unknown, strict?: boolean) {
        this.bin.findProblem(this.input(this.adaptor(value)), strict);
    };

    adapt(value: unknown) {
        return this.output(this.bin.adapt(this.input(this.adaptor(value))));
    };
}

export default new HighwayBin<null, null>(<Bin<null>>null, r => r, r => r);