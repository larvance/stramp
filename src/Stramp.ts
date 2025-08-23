// noinspection JSUnusedGlobalSymbols

import {BufferIndex} from "./BufferIndex";
import BIGINT from "./number/BigIntBin";
import U_BIGINT from "./number/UBigIntBin";
import F64 from "./number/Float64Bin";
import F32 from "./number/Float32Bin";
import I64 from "./number/Int64Bin";
import I32 from "./number/Int32Bin";
import I16 from "./number/Int16Bin";
import I8 from "./number/Int8Bin";
import U64 from "./number/UInt64Bin";
import U32 from "./number/UInt32Bin";
import U16 from "./number/UInt16Bin";
import U8 from "./number/UInt8Bin";
import ZERO from "./number/specials/ZeroBin";
import BIG_ZERO from "./number/specials/BigZeroBin";
import NAN from "./number/specials/NaNBin";
import NULL from "./constant/NullBin";
import UNDEFINED from "./constant/UndefinedBin";
import INF from "./number/specials/InfinityBin";
import NEG_INF from "./number/specials/NegativeInfinityBin";
import TRUE from "./boolean/TrueBin";
import FALSE from "./boolean/FalseBin";
import BOOL from "./boolean/BooleanBin";
import ARRAY, {
    BUFFER,
    F32ARRAY,
    F64ARRAY,
    I16ARRAY,
    I32ARRAY,
    I64ARRAY,
    I8ARRAY,
    SET,
    U16ARRAY,
    U32ARRAY,
    U64ARRAY,
    U8ARRAY,
    U8CLAMPED_ARRAY
} from "./array/ArrayBin";
import ANY, {AnyBinConstructor} from "./any/AnyBin";
import {__def, Bin, getBinByInternalId} from "./Bin";
import NegBigIntBin from "./number/NegBigIntBin";
import DATE from "./object/DateBin";
import OBJECT from "./object/ObjectBin";
import {S16, S32, S8} from "./string/LengthBasedStringBin";
import C_STRING from "./string/CStringBin";
import MAP from "./object/MapBin";
import CLASS_INSTANCE from "./object/ClassInstanceBin";
import IGNORE from "./misc/IgnoreBin";
import REGEXP from "./object/RegExpBin";
import IntBaseBin from "./number/base/IntBaseBin";
import BigIntBaseBin from "./number/base/BigIntBaseBin";
import ObjectStructBin from "./object/ObjectStructBin";
import NUMBER from "./number/NumberBin";
import CONSTANT, {ConstantBinConstructor} from "./misc/ConstantBin";
import {HighwayBinConstructor} from "./misc/HighwayBin";
import {AnyValueBinConstructor} from "./any/AnyValueBin";
import {DefaultsToBin} from "./misc/DefaultsToBin";
import {Big0} from "./Utils";
import {StructBin} from "./misc/StructBin";
import {TupleBinConstructor} from "./array/TupleBin";

class Stramp extends Bin {
    name = "any";
    sample = null;

    // -- Specials --
    null = NULL as typeof NULL;
    undefined = UNDEFINED as typeof UNDEFINED;
    true = TRUE as typeof TRUE;
    false = FALSE as typeof FALSE;
    zero = ZERO as typeof ZERO;
    bigZero = BIG_ZERO as typeof BIG_ZERO;
    NaN = NAN as typeof NAN;
    inf = INF as typeof INF;
    negInf = NEG_INF as typeof NEG_INF;
    // -- Specials --

    u8 = U8 as typeof U8;
    u16 = U16 as typeof U16;
    u32 = U32 as typeof U32;
    u64 = U64 as typeof U64;

    i8 = I8 as typeof I8;
    i16 = I16 as typeof I16;
    i32 = I32 as typeof I32;
    i64 = I64 as typeof I64;

    f32 = F32 as typeof F32;
    f64 = F64 as typeof F64;
    number = NUMBER as typeof NUMBER;

    ubigint = U_BIGINT as typeof U_BIGINT;
    bigint = BIGINT as typeof BIGINT;

    string8 = S8 as typeof S8;
    string16 = S16 as typeof S16;
    string32 = S32 as typeof S32;
    s8 = S8 as typeof S8;
    s16 = S16 as typeof S16;
    s32 = S32 as typeof S32;
    str8 = S8 as typeof S8;
    str16 = S16 as typeof S16;
    str32 = S32 as typeof S32;
    cstring = C_STRING as typeof C_STRING;

    bool = BOOL as typeof BOOL;
    boolean = BOOL as typeof BOOL;

    buffer = BUFFER as typeof BUFFER;
    u8array = U8ARRAY as typeof U8ARRAY;
    u8clampedArray = U8CLAMPED_ARRAY as typeof U8CLAMPED_ARRAY;
    u16array = U16ARRAY as typeof U16ARRAY;
    u32array = U32ARRAY as typeof U32ARRAY;
    u64array = U64ARRAY as typeof U64ARRAY;
    i8array = I8ARRAY as typeof I8ARRAY;
    i16array = I16ARRAY as typeof I16ARRAY;
    i32array = I32ARRAY as typeof I32ARRAY;
    i64array = I64ARRAY as typeof I64ARRAY;
    f32array = F32ARRAY as typeof F32ARRAY;
    f64array = F64ARRAY as typeof F64ARRAY;

    object = OBJECT as typeof OBJECT;
    map = MAP as typeof MAP;
    class = CLASS_INSTANCE as typeof CLASS_INSTANCE;

    date = DATE as typeof DATE;
    regexp = REGEXP as typeof REGEXP;

    any = ANY;
    ignore = IGNORE as typeof IGNORE;
    constant = CONSTANT as typeof CONSTANT;

    tuple(...types: Bin[]) {
        return ARRAY.struct(types);
    };

    unsafeWrite(bind: BufferIndex, value: unknown): void {
        const type = this.getTypeOf(value)!;
        bind.push(type.internalId);
        type.unsafeWrite(bind, value);
    };

    read(bind: BufferIndex, base = null) {
        const id = bind.shift()!;
        const type = getBinByInternalId(id)!;
        return type.read(bind, base);
    };

    unsafeSize(value: unknown): number {
        const type = this.getTypeOf(value)!;
        return 1 + type.unsafeSize(value);
    };

    findProblem(value: unknown) {
        const type = this.getTypeOf(value);
        if (!type) return this.makeProblem("Unknown type");
    };

    getNumberTypeOf(value: number): Bin<number> {
        if (isNaN(value)) return NAN;
        if (value === Infinity) return INF;
        if (value === -Infinity) return NEG_INF;
        if (value === 0) return <Bin<number>>ZERO;
        if (value % 1 === 0) {
            if (value >= 0) {
                if (value <= 255) return U8;
                if (value <= 65_535) return U16;
                if (value <= 4_294_967_295) return U32;
            } else {
                if (value >= -128) return I8;
                if (value >= -32_768) return I16;
                if (value >= -2_147_483_648) return I32;
            }
        }

        // NOTE: Float32 is too imprecise, so we are not using it by default, but it can be optionally used.
        /*const FLOAT32_MAX = 3.4028235e38;
        const FLOAT32_MIN = -3.4028235e38;
        const FLOAT32_SMALLEST_POSITIVE = 1.4e-45;

        if ((value >= FLOAT32_SMALLEST_POSITIVE || value === 0) && value <= FLOAT32_MAX && value >= FLOAT32_MIN) {
            const f32 = new Float32Array(1); // if you ever want to allow float32 by default move this outside for performance
            f32[0] = value;
            if (Math.abs(value - f32[0]) < 1e-15) {
                return F32;
            }
        }*/

        return F64;
    };

    getUnsignedTypeOf(value: number): IntBaseBin {
        if (isNaN(value) || value === Infinity || value === -Infinity || value < 0 || value % 1 !== 0) {
            throw new Error("Value is not an unsigned integer");
        }
        if (value <= 255) return U8;
        if (value <= 65_535) return U16;
        if (value <= 4_294_967_295) return U32;

        throw new Error("Value is too large to be represented as an unsigned 32-bit integer");
    };

    getIntegerTypeOf(value: number): IntBaseBin { // signed
        if (isNaN(value) || value === Infinity || value === -Infinity || value % 1 !== 0) {
            throw new Error("Value is not an integer");
        }

        if (value >= -128 && value <= 127) return I8;
        if (value >= -32_768 && value <= 32_767) return I16;
        if (value >= -2_147_483_648 && value <= 2_147_483_647) return I32;

        throw new Error("Value is too large to be represented as a signed 32-bit integer");
    };

    getTypeOf<T>(value: T): Bin<T> | null;

    getTypeOf(value: unknown): Bin {
        if (value === true) return TRUE;
        if (value === false) return FALSE;
        if (value === null) return NULL;
        if (value === undefined) return UNDEFINED;
        if (typeof value === "bigint") {
            if (value === Big0) return BIG_ZERO;
            if (value > Big0) {
                if (value > U64.max) return BIGINT;
                return U64;
            }
            if (value < -I64.min) return NegBigIntBin;
            return I64;
        }
        if (typeof value === "number") {
            return this.getNumberTypeOf(value);
        }
        if (typeof value === "string") {
            if (value.length <= U8.max) return S8;
            if (value.length <= U16.max) return S16;
            if (value.length <= U32.max) return S32;

            // This is an impossible case because of JavaScript's string length limit, but it's here for completeness
            return C_STRING;
        }
        if (Array.isArray(value)) return ARRAY;
        if (value instanceof Date) return DATE;
        if (value instanceof Map) return MAP;
        if (value instanceof Set) return SET;
        if (value instanceof Uint8Array) return U8ARRAY;
        if (value instanceof Uint8ClampedArray) return U8CLAMPED_ARRAY;
        if (value instanceof Uint16Array) return U16ARRAY;
        if (value instanceof Uint32Array) return U32ARRAY;
        if (value instanceof BigUint64Array) return U64ARRAY;
        if (value instanceof Int8Array) return I8ARRAY;
        if (value instanceof Int16Array) return I16ARRAY;
        if (value instanceof Int32Array) return I32ARRAY;
        if (value instanceof BigInt64Array) return I64ARRAY;
        if (value instanceof Float32Array) return F32ARRAY;
        if (value instanceof Float64Array) return F64ARRAY;
        if (value instanceof RegExp) return REGEXP;
        if (typeof value === "object") return value.constructor === Object ? OBJECT : CLASS_INSTANCE;

        return null;
    };

    getStrictTypeOf<T>(value: T): Bin<T> | null;

    getStrictTypeOf(value: unknown) {
        const base = this.getTypeOf(value);
        if ("struct" in base && typeof base.struct === "function") {
            return base.struct(value);
        }

        return base;
    };

    getStruct<T extends object>(self: T, clazz = self.constructor) {
        if (!(StructSymbol in clazz)) {
            throw new Error(`${clazz.name} instance is not initialized with a structure.`);
        }

        const data = clazz[StructSymbol];

        if (data instanceof StructBin) return <StructBin<T>>data;
        if (clazz[StructLegacyDecoratorSymbol]) {
            // Because it's legacy it won't retrieve the parent classes' defs.
            const parent = Object.getPrototypeOf(clazz);
            if (typeof parent === "function" && parent.hasOwnProperty(StructSymbol)) {
                const parentStruct = this.getStruct(self, parent);
                for (const [name, bin] of parentStruct.data) {
                    if (!data.hasOwnProperty(name)) data[name] = bin;
                }
            }
        }

        return clazz[StructSymbol] = new StructBin<T>(self, clazz.name, <Record<string, Bin>>data);
    };

    def = def;
}

__def.AnyBin = AnyBinConstructor;
__def.DefaultsToBin = DefaultsToBin;
__def.ConstantBin = CONSTANT;
__def.HighwayBin = HighwayBinConstructor;
__def.ArrayBin = ARRAY;
__def.SetBin = SET;
__def.TupleStructBin = TupleBinConstructor
__def.UndefinedBin = UNDEFINED;
__def.NullBin = NULL;

const stramp = new Stramp;

export default stramp;
__def.Stramp = stramp;

export const tuple = stramp.tuple;
export const StructSymbol = Symbol("StructSymbol");
export const StructLegacyDecoratorSymbol = Symbol("StructLegacyDecoratorSymbol");

function structSetter(clazz: object, key: string | symbol, val: object) {
    if (val !== null && !(val instanceof Bin)) {
        throw new Error(`@def can only be used with instances of Bin, got ${typeof val} for key ${key.toString()}`);
    }
    (clazz.hasOwnProperty(StructSymbol) ? clazz[StructSymbol] : (clazz[StructSymbol] = {}))[key] = val;
}

export function def(desc: object): (_: unknown, context: unknown) => void;
export function def(desc: object, context: unknown): void;
export function def(desc: object, context?: unknown) {
    if (typeof context === "string" || typeof context === "symbol") {
        desc.constructor[StructLegacyDecoratorSymbol] = true;
        structSetter(desc.constructor, context, null);
        return;
    }

    if (
        typeof context === "object"
        && "kind" in context
        && context.kind === "field"
        && "name" in context
        && context.name
        && "addInitializer" in context
        && typeof context.addInitializer === "function"
    ) {
        return context.addInitializer(function () {
            structSetter(this.constructor, <string>context.name, null);
        });
    }

    return function (slf: unknown, context: {
        name: string | symbol;
        addInitializer(init: Function): void;
    } | string): void {
        if (typeof context === "string" || typeof context === "symbol") {
            slf.constructor[StructLegacyDecoratorSymbol] = true;
            structSetter(slf.constructor, context, desc);
            return;
        }
        context.addInitializer(function () {
            structSetter(this.constructor, context.name, desc);
        });
    };
}

// noinspection ReservedWordAsName
export {
    U8 as u8,
    U16 as u16,
    U32 as u32,
    U64 as u64,
    I8 as i8,
    I16 as i16,
    I32 as i32,
    I64 as i64,
    F32 as f32,
    F64 as f64,
    U_BIGINT as ubigint,
    BIGINT as bigint,
    S8 as s8,
    S8 as str8,
    S8 as string8,
    S16 as s16,
    S16 as str16,
    S16 as string16,
    S32 as s32,
    S32 as str32,
    S32 as string32,
    C_STRING as cstring,
    BOOL as bool,
    ARRAY as array,
    SET as set,
    BUFFER as buffer,
    U8ARRAY as u8array,
    U16ARRAY as u16array,
    U32ARRAY as u32array,
    U64ARRAY as u64array,
    I8ARRAY as i8array,
    I16ARRAY as i16array,
    I32ARRAY as i32array,
    I64ARRAY as i64array,
    F32ARRAY as f32array,
    F64ARRAY as f64array,
    OBJECT as object,
    MAP as map,
    CLASS_INSTANCE as class,
    DATE as date,
    REGEXP as regexp,
    ANY as any,
    IGNORE as ignore,
    CONSTANT as constant,
    NULL as null,
    UNDEFINED as undefined,
    TRUE as true,
    FALSE as false,
    ZERO as zero,
    BIG_ZERO as bigZero,
    NAN as NaN,
    INF as inf,
    NEG_INF as negInf,

    Bin,
    BufferIndex,
    IntBaseBin,
    BigIntBaseBin,
    ObjectStructBin,
    AnyBinConstructor,
    AnyValueBinConstructor,
    ConstantBinConstructor
}

export type infer<T extends Bin> = T["__TYPE__"];