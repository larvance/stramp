import {BufferIndex} from "./BufferIndex";
import {AnyBinConstructor} from "./any/AnyBin";
import {StrampProblem} from "./StrampProblem";
import {DefaultsToBin} from "./misc/DefaultsToBin";
import UndefinedBin from "./constant/UndefinedBin";
import NullBin from "./constant/NullBin";
import type Stramp from "./Stramp";

let _id = 1;
const bins: Record<number, Bin> = {};

export function getBinByInternalId(id: number): Bin | null {
    return bins[id] ?? null;
}

export const __def = <{
    AnyBin: typeof AnyBinConstructor,
    DefaultsToBin: typeof DefaultsToBin,
    UndefinedBin: typeof UndefinedBin,
    NullBin: typeof NullBin
}>{};

export abstract class Bin<T = any> {
    static any: typeof Stramp;

    internalId = _id++;
    __TYPE__: T;

    abstract name: string;
    abstract isOptional: boolean;

    abstract unsafeWrite(bind: BufferIndex, value: T | Readonly<T>): void;
    abstract read(bind: BufferIndex): T;
    abstract unsafeSize(value: T | Readonly<T>): number;
    abstract findProblem(value: any, strict?: boolean): StrampProblem | void;
    abstract get sample(): T;

    constructor() {
        bins[this.internalId] = this;
    };

    init() {
        return this;
    };

    static create(...args: any[]) {
        const bin = new (<any>this)(...args);
        bin.init();
        return bin;
    };

    copy() {
        return <this>new (<any>this.constructor)();
    };

    write(bind: BufferIndex, value: any) {
        this.assert(value);
        return this.unsafeWrite(bind, value);
    };

    getSize(value: any) {
        this.assert(value);
        return this.unsafeSize(value);
    };

    assert(value: any, strict = false) {
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

    deserialize<Binder extends Buffer | BufferIndex>(
        bind: Binder
    ): T {
        if (bind instanceof BufferIndex) return <any>this.read(bind);
        else return <any>this.read(new BufferIndex(bind, 0));
    };

    default(default_: any): DefaultsToBin<T> {
        return new __def.DefaultsToBin(this, default_);
    };

    makeProblem(problem: string, source = "") {
        return new StrampProblem(problem, this, this, source);
    };

    adapt(value: any): T {
        return this.findProblem(value) ? this.sample : value;
    };
}