import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import UInt8Bin from "../number/UInt8Bin";
import UInt16Bin from "../number/UInt16Bin";
import UInt32Bin from "../number/UInt32Bin";
import {Buffer} from "buffer";
import {StringBin} from "./StringBin";

export default class LengthBasedStringBin extends StringBin {
    sample = "";
    lengthBytes: number;

    constructor(public name: string, public lengthBin: Bin<number>) {
        super();
    };

    init() {
        this.lengthBytes = this.lengthBin.unsafeSize(0);

        return this;
    };

    unsafeWrite(bind: BufferIndex, value: string) {
        const length = Buffer.byteLength(value);
        this.lengthBin.unsafeWrite(bind, length);
        bind.write(value, length);
    };

    read(bind: BufferIndex) {
        const length = this.lengthBin.read(bind);
        return bind.toString("utf8", length);
    };

    unsafeSize(value: string) {
        return this.lengthBytes + Buffer.byteLength(value);
    };

    findProblem(value: unknown) {
        const p = this.findStringProblems(value);
        if (p) return p;

        if (this.lengthBin.findProblem((<string>value).length)) return this.makeProblem(`Expected string length to be a ${this.lengthBin.name}`);
    };

    adapt(value: unknown) {
        const p = this.findStringProblems(value);
        if (p) p.throw();
        const v = <string>value;
        const len = this.lengthBin.adapt(v.length);
        return super.adapt(v.slice(0, len));
    };

    copy(init = true) {
        const o = <this>super.copy();
        o.name = this.name;
        o.lengthBin = this.lengthBin;
        if (init) o.init();
        return o;
    };
}

export const S8 = new LengthBasedStringBin("string8", <Bin<number>><unknown>UInt8Bin).init();
export const S16 = new LengthBasedStringBin("string16", <Bin<number>><unknown>UInt16Bin).init();
export const S32 = new LengthBasedStringBin("string32", <Bin<number>><unknown>UInt32Bin).init();
