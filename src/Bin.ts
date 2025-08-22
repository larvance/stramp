import {BufferIndex} from "./BufferIndex";
import {StrampProblem} from "./StrampProblem";
import type {AnyBinConstructor} from "./any/AnyBin";
import type {DefaultsToBin} from "./misc/DefaultsToBin";
import type UndefinedBin from "./constant/UndefinedBin";
import type NullBin from "./constant/NullBin";
import type Stramp from "./Stramp";
import type {ArrayStructBinConstructor} from "./array/ArrayStructBin";
import type {ArrayBinConstructor} from "./array/ArrayBin";
import type {ConstantBinConstructor} from "./misc/ConstantBin";
import {HighwayBinConstructor} from "./misc/HighwayBin";

let _id = 1;
const bins: Record<number, Bin> = {};

export function getBinByInternalId(id: number): Bin | null {
    return bins[id] ?? null;
}

export const __def = <{
    Stramp: typeof Stramp,
    AnyBin: typeof AnyBinConstructor,
    DefaultsToBin: typeof DefaultsToBin,
    ConstantBin: ConstantBinConstructor<"constant">,
    HighwayBin: typeof HighwayBinConstructor,
    ArrayBin: ArrayBinConstructor<"array">,
    ArrayStructBin: typeof ArrayStructBinConstructor,
    UndefinedBin: typeof UndefinedBin,
    NullBin: typeof NullBin
}>{};

export abstract class Bin<T = unknown> {
    internalId = _id++;
    __TYPE__: T;

    abstract name: string;

    abstract unsafeWrite(bind: BufferIndex, value: T | Readonly<T>): void;
    abstract read(bind: BufferIndex, base?: T | null): T;
    abstract unsafeSize(value: T | Readonly<T>): number;
    abstract findProblem(value: unknown, strict?: boolean): StrampProblem | void;
    abstract get sample(): T;

    constructor() {
        bins[this.internalId] = this;
    };

    init() {
        return this;
    };

    copy() {
        return new (<new() => this>this.constructor)();
    };

    write(bind: BufferIndex, value: unknown) {
        this.assert(value);
        return this.unsafeWrite(bind, value);
    };

    getSize(value: unknown) {
        this.assert(value);
        return this.unsafeSize(value);
    };

    assert(value: unknown, strict = false): asserts value is T {
        const err = this.findProblem(value, strict);
        if (err) err.throw();
    };

    serialize<K extends T>(value: K) {
        this.assert(value);

        // Since we just asserted, everything can be unsafe from here on out.
        const size = this.unsafeSize(value);

        const bind = BufferIndex.allocUnsafe(size);

        this.unsafeWrite(bind, value);

        return bind.buffer;
    };

    parse<Binder extends Buffer | BufferIndex>(bind: Binder, base: T | null = null): T {
        if (bind instanceof BufferIndex) return this.read(bind, base);
        else return this.read(new BufferIndex(bind, 0), base);
    };

    makeProblem(problem: string, source = "") {
        return new StrampProblem(problem, this, this, source);
    };

    adapt(value: unknown): T {
        return this.findProblem(value) ? this.sample : value as T;
    };

    default(default_: T): DefaultsToBin<T> {
        return new __def.DefaultsToBin(this, default_);
    };

    or<K>(other: Bin<K>) {
        return new __def.AnyBin([this, other] as const);
    };

    orValue<K>(value: K) {
        return this.or(__def.ConstantBin.new(value));
    };

    array(size?: number) {
        let bin = __def.ArrayBin.of(this);
        if (typeof size === "number") bin = bin.sized(size);
        return bin;
    };

    pairMap<K>(keyBin: Bin<K>) {
        return __def.Stramp.map.typed(this, keyBin);
    };

    to<K>(...others: Bin<K>[]) {
        return __def.Stramp.array.struct([this, ...others] as const)
    };

    highway<Output>(
        write: (obj: Output) => T,
        read: (obj: T) => Output,
        name = `Highway<${this.name}>`,
        sample = read(this.sample),
        adaptor: (v: unknown) => Output = v => v as Output
    ) {
        return <HighwayBinConstructor<T, Output>>new __def.HighwayBin(this, write, read, name, sample, adaptor);
    };
}