import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import {AnyValueBinConstructor} from "./AnyValueBin";
import IntBaseBin from "../number/base/IntBaseBin";
import UInt32Bin from "../number/UInt32Bin";
import UInt16Bin from "../number/UInt16Bin";
import UInt8Bin from "../number/UInt8Bin";
import {OptionalBin} from "../OptionalBin";
import {IsOptionalBin} from "../Utils";

export class AnyBinConstructor<Bins extends Bin[], T extends Bins[number]["__TYPE__"] = Bins[number]["__TYPE__"]>
    extends Bin<T>
    implements OptionalBin<IsOptionalBin<Bins[number]>> {
    name: string;
    private readonly binIndexBin: IntBaseBin;
    isOptional = null;

    constructor(public readonly bins: Bins) {
        super();
        this.name = `${bins.map(bin => bin.name).join(" | ")}`;
        if (bins.length > (1 << 16) - 1) this.binIndexBin = UInt32Bin;
        else if (bins.length > 255) this.binIndexBin = UInt16Bin;
        else this.binIndexBin = UInt8Bin;
        this.isOptional = bins.some(bin => (<OptionalBin><unknown>bin).isOptional) as typeof this.isOptional;
    };

    getTypeIndexOf<V>(value: V): number | null {
        for (let i = 0; i < this.bins.length; i++) {
            const bin = this.bins[i];
            if (!bin.findProblem(value, true)) return i;
        }

        return null;
    };

    getTypeOf<V>(value: V): Bin<V> | null {
        return this.bins[this.getTypeIndexOf(value)] ?? null;
    };

    unsafeWrite(bind: BufferIndex, value: any, typeId = this.getTypeIndexOf(value)!) {
        this.binIndexBin.unsafeWrite(bind, typeId);
        return this.bins[typeId].unsafeWrite(bind, value);
    };

    read(bind: BufferIndex, base: T | null = null) {
        const id = this.binIndexBin.read(bind);
        const type = <Bin<T>>this.bins[id];
        return type.read(bind, base);
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

    of<V extends Bin[]>(...bins: V) {
        if (bins.length === 0) throw new Error("AnyBin must have at least one bin");
        return <AnyBinConstructor<V>><any>new AnyBinConstructor(bins);
    };

    ofValues<V extends any[]>(...values: V) {
        return new AnyValueBinConstructor(values);
    };

    copy() {
        return <this><unknown>new AnyValueBinConstructor([...this.bins]);
    };
}

export default new AnyBinConstructor([]);