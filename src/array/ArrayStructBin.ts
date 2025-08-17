import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import {ArrayBinConstructor} from "./ArrayBin";
import {DefaultLengthBin} from "../Defaults";

export class ArrayStructBinConstructor<
    ClassType extends "array" | "set" | Iterable<K>,
    K = unknown,
    T extends Iterable<K> = ClassType extends "array" ? K[] : (ClassType extends "set" ? Set<K> : ClassType)
> extends Bin<T> {
    public name: string;

    constructor(
        public readonly typesName: (types: Bin[]) => string,
        public readonly typeName: (type: Bin) => string,
        public readonly fixedName: (fixed: number) => string,
        public readonly fixedTypeName: (fixed: number, type: Bin) => string,
        public readonly baseName: string,
        public readonly types: Bin<K>[] | null = null,
        public readonly baseClass: new (...args: unknown[]) => T
    ) {
        super();
    };

    init() {
        this.name = this.typesName(this.types);

        return this;
    };

    unsafeWrite(bind: BufferIndex, value: T): void {
        const arr = Array.from(value);
        const types = this.types!;
        for (let i = 0; i < types.length; i++) {
            types[i].unsafeWrite(bind, arr[i]);
        }
    };

    read(bind: BufferIndex, base: T | null = null): T {
        const types = this.types!;
        const length = types.length;

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

        const result = base !== null ? <Set<unknown>><unknown>base : new Array(length);

        for (let i = 0; i < length; i++) {
            const v = types[i].read(bind);
            if ("add" in result) result.add(v);
            else if ("push" in result) result.push(v);
            else (<unknown[]>result)[i] = v;
        }

        return (<ArrayConstructor | typeof this.baseClass>this.baseClass) === Array ? <T><unknown>result : new this.baseClass(result);
    };

    unsafeSize(value: T): number {
        let size = 0;
        const types = this.types!;
        const arr = Array.from(value);

        for (let i = 0; i < types.length; i++) {
            size += types[i].unsafeSize(arr[i]);
        }

        return size;
    };

    findProblem(value: unknown, strict = false) {
        if (value === null || typeof value !== "object" || !(Symbol.iterator in value)) return this.makeProblem("Expected an iterable");

        if (strict && value.constructor !== this.baseClass) return this.makeProblem(`Expected an iterable of ${this.baseName}`);

        const types = this.types!;
        const arr = Array.from(value as Iterable<unknown>);

        for (let i = 0; i < types.length; i++) {
            const type = types[i];
            const problem = type.findProblem(arr[i], strict);
            if (problem) return problem.shifted(`[indexed:${i}]`, this);
        }
    };

    get sample(): T {
        const types = this.types!;
        let result = new Array(types.length);

        for (let i = 0; i < types.length; i++) {
            result[i] = types[i].sample;
        }

        return new this.baseClass(result);
    };

    adapt(value: unknown): T {
        if (typeof value !== "object" || value === null || !(Symbol.iterator in value)) value = [];

        const arr = Array.from(value as Iterable<unknown>);
        const fixedSize = this.types.length;

        for (let i = 0; i < fixedSize; i++) {
            arr[i] = i >= arr.length ? this.types[i].sample : this.types[i].adapt(arr[i]);
        }

        return super.adapt(arr);
    };

    normal() {
        return new ArrayBinConstructor<ClassType, K, T>(
            this.typesName,
            this.typeName,
            this.fixedName,
            this.fixedTypeName,
            this.baseName,
            null,
            null,
            DefaultLengthBin,
            this.baseClass
        );
    };

    copy(init = true) {
        const o = <this>new ArrayStructBinConstructor(
            this.typesName,
            this.typeName,
            this.fixedName,
            this.fixedTypeName,
            this.baseName,
            this.types,
            this.baseClass
        );
        if (init) o.init();
        return o;
    };
}
