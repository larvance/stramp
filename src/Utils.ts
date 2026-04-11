import {Buffer} from "buffer";
import {OptionalBin} from "./OptionalBin";
import {Bin} from "./Bin";

export const Big0 = BigInt(0);
export const BigMin = BigInt("-9223372036854775808");
export const BigMax = BigInt("18446744073709551615");
export const BigMinusOne = BigInt("-1");
export const BigOne = BigInt("1");
export const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&\/=]*)/;
export const cuidRegex = /^c[^\s-]{8,}$/i;
export const cuid2Regex = /^[0-9a-z]+$/;
export const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
export const uuidRegex =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
export const nanoidRegex = /^[a-z0-9_-]{21}$/i;
export const durationRegex =
    /^[-+]?P(?!$)(?:[-+]?\d+Y|[-+]?\d+[.,]\d+Y$)?(?:[-+]?\d+M|[-+]?\d+[.,]\d+M$)?(?:[-+]?\d+W|[-+]?\d+[.,]\d+W$)?(?:[-+]?\d+D|[-+]?\d+[.,]\d+D$)?(?:T(?=[\d+-])(?:[-+]?\d+H|[-+]?\d+[.,]\d+H$)?(?:[-+]?\d+M|[-+]?\d+[.,]\d+M$)?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
export const emailRegex =
    /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
export const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
export const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
export const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+|::(ffff(:0{1,4})?:)?((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9]))$/;
export const base64Regex =
    /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
export const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
export const dateRegex = new RegExp(`^${dateRegexSource}$`);

export type IsOptionalBin<T> = T extends OptionalBin ? true : false;

export function isBuffer(buffer: object): buffer is Buffer {
    return buffer instanceof Buffer || "_isBuffer" in buffer;
}

export type ClassType<T = unknown> = { new(...args: unknown[]): T };
export type BinValues<TBins extends readonly Bin[]> = {
    [K in keyof TBins]: TBins[K] extends Bin<infer V> ? V : never;
};

export class SortedMap<K, V> {
    private _keys: K[] = [];
    private _vals: V[] = [];

    constructor(private readonly compare: (a: K, b: K) => number = defaultCompare) {
    };

    set(key: K, value: V): this {
        const idx = lowerBound(this._keys, key, this.compare);
        if (idx < this._keys.length && this.compare(this._keys[idx], key) === 0) {
            this._vals[idx] = value;
        } else {
            this._keys.splice(idx, 0, key);
            this._vals.splice(idx, 0, value);
        }
        return this;
    };

    get(key: K): V | undefined {
        const idx = lowerBound(this._keys, key, this.compare);
        if (idx < this._keys.length && this.compare(this._keys[idx], key) === 0) {
            return this._vals[idx];
        }
        return undefined;
    };

    has(key: K): boolean {
        const idx = lowerBound(this._keys, key, this.compare);
        return idx < this._keys.length && this.compare(this._keys[idx], key) === 0;
    };

    delete(key: K): boolean {
        const idx = lowerBound(this._keys, key, this.compare);
        if (idx >= this._keys.length || this.compare(this._keys[idx], key) !== 0) return false;
        this._keys.splice(idx, 1);
        this._vals.splice(idx, 1);
        return true;
    };

    get size(): number {
        return this._keys.length;
    };

    * entries(): IterableIterator<[K, V]> {
        for (let i = 0; i < this._keys.length; i++) {
            yield [this._keys[i], this._vals[i]];
        }
    };

    * keys(): IterableIterator<K> {
        yield* this._keys;
    };

    * values(): IterableIterator<V> {
        yield* this._vals;
    };

    [Symbol.iterator](): IterableIterator<[K, V]> {
        return this.entries();
    };

    forEach(cb: (value: V, key: K, map: this) => void): void {
        for (let i = 0; i < this._keys.length; i++) {
            cb(this._vals[i], this._keys[i], this);
        }
    };

    * slice(from: K, to: K): IterableIterator<[K, V]> {
        const start = lowerBound(this._keys, from, this.compare);
        const end = lowerBound(this._keys, to, this.compare);
        for (let i = start; i < end; i++) {
            yield [this._keys[i], this._vals[i]];
        }
    };

    concat(other: SortedMap<K, V>) {
        const result = new SortedMap<K, V>(this.compare);
        let i = 0, j = 0;
        while (i < this._keys.length && j < other._keys.length) {
            const cmp = this.compare(this._keys[i], other._keys[j]);
            if (cmp === 0) {
                result.set(this._keys[i], other._vals[j]);
                i++;
                j++;
            } else if (cmp < 0) {
                result.set(this._keys[i], this._vals[i]);
                i++;
            } else {
                result.set(other._keys[j], other._vals[j]);
                j++;
            }
        }
        while (i < this._keys.length) {
            result.set(this._keys[i], this._vals[i]);
            i++;
        }
        while (j < other._keys.length) {
            result.set(other._keys[j], other._vals[j]);
            j++;
        }
        return result;
    };

    copy() {
        const result = new SortedMap<K, V>(this.compare);
        result._keys = this._keys.slice();
        result._vals = this._vals.slice();
        return result;
    };
}

function defaultCompare<K>(a: K, b: K): number {
    return a < b ? -1 : a > b ? 1 : 0;
}

function lowerBound<K>(keys: K[], key: K, compare: (a: K, b: K) => number): number {
    let lo = 0;
    let hi = keys.length;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (compare(keys[mid], key) < 0) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}
