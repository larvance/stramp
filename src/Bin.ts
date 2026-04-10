import {Buffer} from "buffer";
import {BufferIndex} from "./BufferIndex";
import {StrampProblem} from "./StrampProblem";
import type {AnyBinConstructor} from "./any/AnyBin";
import type {DefaultsToBin} from "./misc/DefaultsToBin";
import type UndefinedBin from "./constant/UndefinedBin";
import type NullBin from "./constant/NullBin";
import type Stramp from "./Stramp";
import type {ArrayBinConstructor} from "./array/ArrayBin";
import type {ConstantBinConstructor} from "./misc/ConstantBin";
import {HighwayBinConstructor} from "./misc/HighwayBin";
import {ObjectBinConstructor} from "./object/ObjectBin";
import {isBuffer} from "./Utils";
import type {TupleBinConstructor} from "./array/TupleBin";

let _id = 1;
const bins: Record<number, Bin> = {};

export type RecursionMode = "off" | "auto";
export type SerializeOptions = {
    circular?: RecursionMode;
};
export type ParseOptions = {
    circular?: RecursionMode;
};
type WriteContext = {
    mode: RecursionMode;
    seen: WeakMap<object, number>;
    nextId: number;
};
type ReadContext = {
    mode: RecursionMode;
    byId: Map<number, unknown>;
};
type SizeContext = {
    mode: RecursionMode;
    seen: WeakSet<object>;
};

const writeContextStack: WriteContext[] = [];
const readContextStack: ReadContext[] = [];
const sizeContextStack: SizeContext[] = [];

export const REF_TAG = 0;
export const INLINE_TAG = 1;

function getWriteContext() {
    return writeContextStack[writeContextStack.length - 1] ?? null;
}

function getReadContext() {
    return readContextStack[readContextStack.length - 1] ?? null;
}

function getSizeContext() {
    return sizeContextStack[sizeContextStack.length - 1] ?? null;
}

function isRefValue(value: unknown): value is object {
    return value !== null && typeof value === "object";
}

function hasCycle(value: unknown, path = new WeakSet<object>(), seen = new WeakSet<object>()): boolean {
    if (!isRefValue(value)) return false;
    if (value instanceof Date || value instanceof RegExp || ArrayBuffer.isView(value)) return false;
    if (path.has(value)) return true;
    if (seen.has(value)) return false;

    seen.add(value);
    path.add(value);

    let children: unknown[] = [];

    if (Array.isArray(value)) children = value;
    else if (value instanceof Map) {
        for (const [k, v] of value) children.push(k, v);
    } else if (value instanceof Set) {
        for (const v of value) children.push(v);
    } else {
        children = Object.values(value);
    }

    for (let i = 0; i < children.length; i++) {
        if (hasCycle(children[i], path, seen)) return true;
    }

    path.delete(value);
    return false;
}

export function graphWriteReference(bind: BufferIndex, value: unknown) {
    const ctx = getWriteContext();
    if (!ctx || ctx.mode === "off" || !isRefValue(value)) return null;

    const id = ctx.seen.get(value);
    if (id !== undefined) {
        bind.push(REF_TAG);
        bind.writeUInt32(id);
        return {kind: "ref" as const, id};
    }

    const nextId = ctx.nextId++;
    ctx.seen.set(value, nextId);
    bind.push(INLINE_TAG);
    bind.writeUInt32(nextId);
    return {kind: "inline" as const, id: nextId};
}

export function graphReadReference(bind: BufferIndex) {
    const ctx = getReadContext();
    if (!ctx || ctx.mode === "off") return null;

    const tag = bind.shift();
    const id = bind.readUInt32();

    if (tag === REF_TAG) return {kind: "ref" as const, id};
    if (tag === INLINE_TAG) return {kind: "inline" as const, id};
    throw new Error(`Invalid graph tag ${tag}`);
}

export function graphSetReadReference(id: number, value: unknown) {
    const ctx = getReadContext();
    if (!ctx || ctx.mode === "off") return;
    ctx.byId.set(id, value);
}

export function graphSizeReference(value: unknown) {
    const ctx = getSizeContext();
    if (!ctx || ctx.mode === "off" || !isRefValue(value)) return null;

    if (ctx.seen.has(value)) return {kind: "ref" as const};
    ctx.seen.add(value);
    return {kind: "inline" as const};
}

export function graphGetReadReference<T>(id: number): T {
    const ctx = getReadContext();
    if (!ctx || ctx.mode === "off") throw new Error("Graph context not available");
    if (!ctx.byId.has(id)) throw new Error(`Unknown graph reference id ${id}`);
    return ctx.byId.get(id) as T;
}

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
    SetBin: ArrayBinConstructor<"set">,
    TupleStructBin: typeof TupleBinConstructor,
    UndefinedBin: typeof UndefinedBin,
    NullBin: typeof NullBin
}>{};

export abstract class Bin<T = unknown> {
    internalId = _id++;
    __TYPE__: T;
    unsafeBuffers = false;

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

    serialize<K extends T>(value: K): Buffer;
    serialize<K extends T>(value: K, bindOrBuffer: Buffer): Buffer;
    serialize<K extends T>(value: K, bindOrBuffer: BufferIndex): BufferIndex;
    serialize<K extends T>(value: K, options: SerializeOptions): Buffer;
    serialize<K extends T>(value: K, bindOrBuffer: Buffer | BufferIndex, options: SerializeOptions): Buffer | BufferIndex;
    serialize<K extends T>(
        value: K,
        bindOrBufferOrOptions?: Buffer | BufferIndex | SerializeOptions,
        options?: SerializeOptions
    ) {
        let bindOrBuffer: Buffer | BufferIndex | undefined;
        if (
            bindOrBufferOrOptions instanceof BufferIndex
            || (bindOrBufferOrOptions && typeof bindOrBufferOrOptions === "object" && isBuffer(bindOrBufferOrOptions))
        ) {
            bindOrBuffer = bindOrBufferOrOptions;
        } else if (bindOrBufferOrOptions && typeof bindOrBufferOrOptions === "object") {
            options = bindOrBufferOrOptions as SerializeOptions;
        }

        const mode = options?.circular ?? "off";

        if (!(mode === "auto" && hasCycle(value))) {
            this.assert(value);
        }

        sizeContextStack.push({
            mode,
            seen: new WeakSet<object>()
        });
        let size = 0;
        try {
            size = this.unsafeSize(value);
        } finally {
            sizeContextStack.pop();
        }

        const bind = bindOrBuffer
            ? (isBuffer(bindOrBuffer) ? new BufferIndex(bindOrBuffer, 0) : bindOrBuffer)
            : (this.unsafeBuffers ? BufferIndex.allocUnsafe(size) : BufferIndex.alloc(size));

        writeContextStack.push({
            mode,
            seen: new WeakMap<object, number>(),
            nextId: 0
        });
        try {
            this.unsafeWrite(bind, value);
        } finally {
            writeContextStack.pop();
        }

        return bindOrBuffer instanceof BufferIndex ? bind : bind.buffer;
    };

    parse<Binder extends Buffer | BufferIndex>(bind: Binder, base: T | null = null, options?: ParseOptions): T {
        const mode = options?.circular ?? "off";
        readContextStack.push({
            mode,
            byId: new Map<number, unknown>()
        });
        try {
            if (bind instanceof BufferIndex) return this.read(bind, base);
            else return this.read(new BufferIndex(bind, 0), base);
        } finally {
            readContextStack.pop();
        }
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

    or<K>(...others: Bin<K>[]) {
        return new __def.AnyBin([this, ...others] as const);
    };

    orValue<K>(value: K) {
        return this.or(__def.ConstantBin.new(value));
    };

    nullable() {
        return __def.NullBin.or(this);
    };

    array(size?: number) {
        let bin = __def.ArrayBin.of(this);
        if (typeof size === "number") bin = bin.sized(size);
        return bin;
    };

    set(size?: number) {
        let bin = __def.SetBin.of(this);
        if (typeof size === "number") bin = bin.sized(size);
        return bin;
    };

    pairMap<K>(keyBin: Bin<K>) {
        return __def.Stramp.map.typed(this, keyBin);
    };

    pairWithKey<K extends string | number | symbol>(keyBin: Bin<K>) {
        return <ObjectBinConstructor<Bin<T>>>__def.Stramp.object.keyTyped(keyBin).valueTyped(this);
    };

    to<const Others extends readonly Bin[]>(...others: Others) {
        return __def.ArrayBin.struct([this, ...others] as const);
    };

    highway<Output>(
        write: (obj: Output) => T,
        read: (obj: T) => Output,
        sample = read(this.sample),
        adaptor: (v: unknown) => Output = v => v as Output,
        name = `Highway<${this.name}>`
    ) {
        return <HighwayBinConstructor<T, Output>>new __def.HighwayBin(this, write, read, name, sample, adaptor);
    };

    getStrictTypeOf<K>(_: K): Bin;
    getStrictTypeOf(_: unknown): Bin {
        return this;
    };
}