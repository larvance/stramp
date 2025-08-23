import {__def, Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import UInt8Bin from "../number/UInt8Bin";
import UInt16Bin from "../number/UInt16Bin";
import UInt64Bin from "../number/UInt64Bin";
import UInt32Bin from "../number/UInt32Bin";
import Int8Bin from "../number/Int8Bin";
import Int16Bin from "../number/Int16Bin";
import Int32Bin from "../number/Int32Bin";
import Int64Bin from "../number/Int64Bin";
import Float32Bin from "../number/Float32Bin";
import Float64Bin from "../number/Float64Bin";
import {Buffer} from "buffer";
import {DefaultLengthBin} from "../Defaults";

// type SizedArray<T, N extends number, R extends T[] = []> = R["length"] extends N ? R : SizedArray<T, N, [...R, T]>;

// all array type combinations:
// - any[]       type=null   types=null        fixedSize=null
// - X[]         type=X      types=null        fixedSize=null
// - [X, Y, Z]   type=null   types=[X, Y, Z]   fixedSize=null
// - any[S]      type=null   types=null        fixedSize=S
// - X[S]        type=X      types=null        fixedSize=S

export class ArrayBinConstructor<
    ClassType extends "array" | "set" | Iterable<K>,
    K = unknown,
    T extends Iterable<K> = ClassType extends "array" ? K[] : (ClassType extends "set" ? Set<K> : ClassType)
> extends Bin<T> {
    name: string;
    lengthBinSize: number;
    private readonly _baseClass: (typeof this.baseClass) & ArrayConstructor;

    constructor(
        public readonly typesName: (types: Bin[]) => string,
        public readonly typeName: (type: Bin) => string,
        public readonly fixedName: (fixed: number) => string,
        public readonly fixedTypeName: (fixed: number, type: Bin) => string,
        public readonly baseName: string,
        public readonly type: Bin<K> | null = null,
        public readonly fixedSize: number | null = null,
        public readonly lengthBin: Bin<number> = DefaultLengthBin,
        public readonly baseClass: new (...args: unknown[]) => T
    ) {
        super();
        this._baseClass = <(typeof this.baseClass) & ArrayConstructor>baseClass;
    }

    init() {
        this.lengthBinSize = this.lengthBin.unsafeSize(0);

        if (this.fixedSize) {
            if (this.type) {
                this.name = this.fixedTypeName(this.fixedSize, this.type);
            } else {
                this.name = this.fixedName(this.fixedSize);
            }
        } else if (this.type) {
            this.name = this.typeName(this.type);
        } else {
            this.name = this.baseName;
        }

        return this;
    };

    unsafeWrite(bind: BufferIndex, value: T): void {
        if (!this.fixedSize) {
            let length: number = "size" in value && typeof value.size === "number"
                ? value.size
                : ("length" in value && typeof value.length === "number" ? value.length : 0);
            this.lengthBin.unsafeWrite(bind, length);
        }

        const type = this.type || __def.Stramp;
        const arr = Array.from(value);
        for (let i = 0; i < arr.length; i++) {
            type.unsafeWrite(bind, arr[i]);
        }
    };

    read(bind: BufferIndex, base: T | null = null): T {
        const length = this.fixedSize ?? this.lengthBin.read(bind);

        if (base !== null) {
            if (this.baseClass !== base.constructor) {
                throw new Error(`Cannot read into an array of type ${base.constructor.name}, expected ${this.baseClass.name}.`);
            }
            if (!Array.isArray(base) && !(base instanceof Set)) {
                if ("length" in base) {
                    if (base.length !== length) {
                        throw new Error(`Cannot read into an array of type ${this.baseClass.name} with length ${base.length}, expected length ${length}.`);
                    }
                } else if ("size" in base) {
                    if (base.size !== length) {
                        throw new Error(`Cannot read into an array of type ${this.baseClass.name} with length ${base.size}, expected length ${length}.`);
                    }
                } else {
                    throw new Error(`Cannot read into an array of type ${this.baseClass.name}, expected Array, Set or an iterable that has 'length' or 'size' defined.`);
                }
            }
        }

        const result = base !== null ? <unknown[] | Set<unknown>><unknown>base : [];

        const type = this.type || __def.Stramp;
        for (let i = 0; i < length; i++) {
            const v = type.read(bind);
            if ("add" in result) result.add(v);
            else if ("push" in result) result.push(v);
            else (<unknown[]>result)[i] = v;
        }

        return this._baseClass === Array || base !== null ? <T><unknown>result : new this.baseClass(result);
    };

    unsafeSize(value: T): number {
        let size = this.fixedSize ? 0 : this.lengthBinSize;
        const type = this.type || __def.Stramp;
        const arr = Array.from(value);
        const length = arr.length;

        for (let i = 0; i < length; i++) {
            size += type.unsafeSize(arr[i]);
        }

        return size;
    };

    findProblem(value: unknown, strict = false) {
        if (value === null || typeof value !== "object" || !(Symbol.iterator in value)) return this.makeProblem("Expected an iterable");

        if (strict && value.constructor !== this.baseClass) return this.makeProblem(`Expected an iterable of ${this.baseName}`);

        const type = this.type || __def.Stramp;
        const arr = Array.from(value as Iterable<unknown>);

        if (this.fixedSize !== null && this.fixedSize !== arr.length) return this.makeProblem(`Expected an iterable of length ${this.fixedSize}, got ${arr.length}`);

        for (let i = 0; i < arr.length; i++) {
            const problem = type.findProblem(arr[i], strict);
            if (problem) return problem.shifted(`[indexed:${i}]`, this);
        }
    };

    get sample(): T {
        if (!this.fixedSize) return new this.baseClass();

        const type = this.type || __def.Stramp;
        const result = Array(this.fixedSize);

        for (let i = 0; i < this.fixedSize; i++) {
            result[i] = type.sample;
        }

        return new this.baseClass(result);
    };

    adapt(value: unknown): T {
        if (typeof value !== "object" || value === null || !(Symbol.iterator in value)) value = [];

        const arr = Array.from(value as Iterable<unknown>);

        if (this.fixedSize) {
            if (arr.length > this.fixedSize) arr.length = this.fixedSize;
            else {
                const len = arr.length;

                for (let i = len; i < this.fixedSize; i++) {
                    arr.push(this.type ? this.type.sample : null);
                }
            }
        }

        const maxLength = 1 << this.lengthBinSize;

        if (arr.length >= maxLength) {
            arr.length = maxLength - 1;
        }

        if (this.type) for (let i = 0; i < arr.length; i++) {
            arr[i] = this.type.adapt(arr[i]);
        }

        return super.adapt(this._baseClass === Array ? arr : new this.baseClass(arr));
    };

    lengthBytes<N extends Bin<number>>(lengthBin: N) {
        const o = <ArrayBinConstructor<ClassType, K, T>>new ArrayBinConstructor(
            this.typesName,
            this.typeName,
            this.fixedName,
            this.fixedTypeName,
            this.baseName,
            this.type,
            this.fixedSize,
            lengthBin,
            this.baseClass
        );
        o.init();
        return o;
    };

    sized<N extends number>(fixedSize: N) {
        const o = <ArrayBinConstructor<ClassType, K, T>>new ArrayBinConstructor(
            this.typesName,
            this.typeName,
            this.fixedName,
            this.fixedTypeName,
            this.baseName,
            this.type,
            fixedSize,
            this.lengthBin,
            this.baseClass
        );
        o.init();
        return o;
    };

    typed<N>(type: Bin<N>) {
        const o = <ArrayBinConstructor<ClassType extends "array" ? "array" : (ClassType extends "set" ? "set" : ClassType & Iterable<N>), N>>new ArrayBinConstructor(
            this.typesName,
            this.typeName,
            this.fixedName,
            this.fixedTypeName,
            this.baseName,
            type,
            this.fixedSize,
            this.lengthBin,
            this._baseClass
        );
        o.init();
        return o;
    };

    of<N>(type: Bin<N>) {
        return this.typed(type);
    };

    classed<CT extends new (...args: unknown[]) => Iterable<NK>, NK>(clazz: CT) {
        const o = <ArrayBinConstructor<InstanceType<CT>, NK>><unknown>new ArrayBinConstructor(
            this.typesName,
            this.typeName,
            this.fixedName,
            this.fixedTypeName,
            this.baseName,
            this.type,
            this.fixedSize,
            this.lengthBin,
            <new (...args: unknown[]) => Iterable<K>>clazz
        );
        o.init();
        return o;
    };

    struct<N extends unknown[]>(types: Bin<N[number]>[]) {
        return new __def.TupleStructBin<N>(
            this.typesName,
            this.typeName,
            this.fixedName,
            this.fixedTypeName,
            this.baseName,
            types
        );
    };

    copy(init = true) {
        const o = new ArrayBinConstructor(
            this.typesName,
            this.typeName,
            this.fixedName,
            this.fixedTypeName,
            this.baseName,
            this.type,
            this.fixedSize,
            this.lengthBin,
            this.baseClass
        );
        if (init) o.init();
        return <this><unknown>o;
    };
}

export default new ArrayBinConstructor<"array">(
    (types: Bin[]) => `[ ${types.map(t => t.name).join(", ")} ]`,
    (type: Bin) => `${type.name.includes(" ") ? `(${type.name})` : type.name}[]`,
    (fixed: number) => `any[${fixed}]`,
    (fixed: number, type: Bin) => `${type.name.includes(" ") ? `(${type.name})` : type.name}[${fixed}]`,
    "Array",
    null,
    null,
    DefaultLengthBin,
    Array
).copy();

export function makeTypedArrayBin<
    ArrayType extends Iterable<unknown>, T extends Bin
>(
    clazz: (new (...args: unknown[]) => ArrayType)
        | ((...args: unknown[]) => ArrayType),
    type: T
) {
    return new ArrayBinConstructor<ArrayType, T["__TYPE__"]>(
        () => {
            throw new Error(`${clazz.name} only supports ${type.name}`);
        },
        (type_: Bin) => {
            if (type_ !== type) throw new Error(`${clazz.name} only supports ${type.name}`);
            return clazz.name;
        },
        (fixed: number) => `${clazz.name}<length=${fixed}>`,
        (fixed: number, type_: Bin) => {
            if (type_ !== type) throw new Error(`${clazz.name} only supports ${type.name}`);
            return `${clazz.name}<length=${fixed}>`;
        },
        clazz.name,
        type,
        null,
        DefaultLengthBin,
        <new (...args: unknown[]) => ArrayType extends "array" ? null : ArrayType extends "set" ? null : ArrayType>clazz
    );
}

export const SET = new ArrayBinConstructor<"set">(
    (types: Bin[]) => `Set<${types.map(t => t.name).join(", ")}>`,
    (type: Bin) => `Set<type=${type.name}>`,
    (fixed: number) => `Set<length=${fixed}>`,
    (fixed: number, type: Bin) => `Set<type=${type.name}, length=${fixed}>`,
    "Set",
    null,
    null,
    DefaultLengthBin,
    Set
).copy();

export const BUFFER: ArrayBinConstructor<Buffer> = makeTypedArrayBin(function (x: number[]) {
    return Buffer.from(x);
}, UInt8Bin);
export const U8ARRAY = makeTypedArrayBin(Uint8Array, UInt8Bin);
export const U8CLAMPED_ARRAY = makeTypedArrayBin(Uint8ClampedArray, UInt8Bin);
export const U16ARRAY = makeTypedArrayBin(Uint16Array, UInt16Bin);
export const U32ARRAY = makeTypedArrayBin(Uint32Array, UInt32Bin);
export const U64ARRAY = makeTypedArrayBin(BigUint64Array, UInt64Bin);
export const I8ARRAY = makeTypedArrayBin(Int8Array, Int8Bin);
export const I16ARRAY = makeTypedArrayBin(Int16Array, Int16Bin);
export const I32ARRAY = makeTypedArrayBin(Int32Array, Int32Bin);
export const I64ARRAY = makeTypedArrayBin(BigInt64Array, Int64Bin);
export const F32ARRAY = makeTypedArrayBin(Float32Array, Float32Bin);
export const F64ARRAY = makeTypedArrayBin(Float64Array, Float64Bin);
