import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import {ArrayBinConstructor} from "./ArrayBin";
import {DefaultLengthBin} from "../Defaults";

export class ArrayStructBinConstructor<
    ClassType extends "array" | "set" | Iterable<any>,
    K extends any = any,
    T extends Iterable<K> = ClassType extends "array" ? K[] : (ClassType extends "set" ? Set<K> : ClassType)
> extends Bin<T> {
    public name: string;
    private readonly _baseClass: any;

    constructor(
        public readonly typesName: (types: Bin[]) => string,
        public readonly typeName: (type: Bin) => string,
        public readonly fixedName: (fixed: number) => string,
        public readonly fixedTypeName: (fixed: number, type: Bin) => string,
        public readonly baseName: string,
        public readonly types: Bin<K>[] | null = null,
        public readonly baseClass: new (...args: any[]) => T
    ) {
        super();
        this._baseClass = baseClass;
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
            if (this._baseClass !== base.constructor) {
                throw new Error(`Cannot read into an array of type ${base.constructor.name}, expected ${this._baseClass.name}.`);
            }
            if (!Array.isArray(base) && !(base instanceof Set)) {
                if ("length" in base) {
                    if (base.length !== length) {
                        throw new Error(`Cannot read into an array of type ${this._baseClass.name} with length ${base.length}, expected length ${length}.`);
                    }
                } else if ("size" in base) {
                    if (base.size !== length) {
                        throw new Error(`Cannot read into an array of type ${this._baseClass.name} with length ${base.size}, expected length ${length}.`);
                    }
                } else {
                    throw new Error(`Cannot read into an array of type ${this._baseClass.name}, expected Array, Set or an iterable that has 'length' or 'size' defined.`);
                }
            }
        }

        const result: any = base !== null ? base : new Array(length);

        for (let i = 0; i < length; i++) {
            const v = types[i].read(bind);
            if ("add" in result) result.add(v);
            else if ("push" in result) result.push(v);
            else result[i] = v;
        }

        return this._baseClass === Array ? result : new this._baseClass(result);
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

    findProblem(value: any, strict = false) {
        if (value === null || typeof value !== "object" || !(Symbol.iterator in value)) return this.makeProblem("Expected an iterable");

        if (strict && value.constructor !== this._baseClass) return this.makeProblem(`Expected an iterable of ${this.baseName}`);

        const types = this.types!;
        const arr = Array.from(value);

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

        return new this._baseClass(result);
    };

    adapt(value: any): T {
        if (typeof value !== "object" || value === null || !(Symbol.iterator in value)) value = [];

        value = Array.from(value);
        const fixedSize = this.types.length;

        for (let i = 0; i < fixedSize; i++) {
            value[i] = i >= value.length ? this.types[i].sample : this.types[i].adapt(value[i]);
        }

        return super.adapt(value);
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
            this._baseClass
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
            this._baseClass
        );
        if (init) o.init();
        return o;
    };
}
