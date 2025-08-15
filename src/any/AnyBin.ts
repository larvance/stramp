import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import {AnyValueBinConstructor} from "./AnyValueBin";
import IntBaseBin from "../number/base/IntBaseBin";
import UInt32Bin from "../number/UInt32Bin";
import UInt16Bin from "../number/UInt16Bin";
import UInt8Bin from "../number/UInt8Bin";

export class AnyBinConstructor<Bins extends Bin[]> extends Bin<Bins[number]["__TYPE__"]> {
    name: string;
    private readonly binIndexBin: IntBaseBin;
    isOptional = <true extends Bins[number]["isOptional"] ? true : false>null;

    constructor(public readonly bins: Bins) {
        super();
        this.name = `${bins.map(bin => bin.name).join(" | ")}`;
        if (bins.length > (1 << 16) - 1) this.binIndexBin = UInt32Bin;
        else if (bins.length > 255) this.binIndexBin = UInt16Bin;
        else this.binIndexBin = UInt8Bin;
        this.isOptional = bins.some(bin => bin.isOptional) as typeof this.isOptional;
    };

    getTypeIndexOf<T>(value: T): number | null {
        for (let i = 0; i < this.bins.length; i++) {
            const bin = this.bins[i];
            if (!bin.findProblem(value, true)) return i;
        }

        return null;
    };
    getTypeOf<T>(value: T): Bin<T> | null {
        return this.bins[this.getTypeIndexOf(value)] ?? null;
    };

    unsafeWrite(bind: BufferIndex, value: any, typeId = this.getTypeIndexOf(value)!) {
        this.binIndexBin.unsafeWrite(bind, typeId);
        return this.bins[typeId].unsafeWrite(bind, value);
    };

    read(bind: BufferIndex) {
        const id = this.binIndexBin.read(bind);
        const type = this.bins[id];
        return type.read(bind);
    };

    unsafeSize(value: any, type = this.getTypeOf(value)!): number {
        return type.unsafeSize(value) + this.binIndexBin.bytes;
    };

    findProblem(value: any, _ = false, type_ = this.getTypeOf(value)!) {
        if (!type_) return this.makeProblem("Unsupported type");
    };

    get sample() {
        return this.bins[0].sample;
    };

    of<T extends Bin[]>(...bins: T) {
        if (bins.length === 0) throw new Error("AnyBin must have at least one bin");
        return <AnyBinConstructor<T>><any>new AnyBinConstructor(bins);
    };

    ofValues<T extends any[]>(...values: T) {
        return new AnyValueBinConstructor(values);
    };

    copy() {
        return <this><unknown>new AnyValueBinConstructor([...this.bins]);
    };
}

export default new AnyBinConstructor([]);