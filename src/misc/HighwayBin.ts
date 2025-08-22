import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import {OptionalBin} from "../OptionalBin";
import {StrampProblem} from "../StrampProblem";

export class HighwayBinConstructor<Input, Output> extends Bin<Output> {
    constructor(
        public bin: Bin<Input>,
        public writeFn: (obj: Output) => Input,
        public readFn: (obj: Input) => Output,
        public name = `Highway<${bin.name}>`,
        public sample = readFn(bin.sample),
        public adaptor: (v: unknown) => Output = v => v as Output // "trust me bro"
    ) {
        super();
    };

    unsafeWrite(bind: BufferIndex, value: Output) {
        this.bin.unsafeWrite(bind, this.writeFn(value));
    };

    read(bind: BufferIndex) {
        return this.readFn(this.bin.read(bind));
    };

    unsafeSize(value: Output) {
        return this.bin.unsafeSize(this.writeFn(value));
    };

    findProblem(value: unknown, strict?: boolean) {
        try {
            this.bin.findProblem(this.writeFn(this.adaptor(value)), strict);
        } catch (e) {
            if (e instanceof StrampProblem) return e;
            throw e;
        }
    };

    adapt(value: unknown) {
        return this.readFn(this.bin.adapt(this.writeFn(this.adaptor(value))));
    };
}
