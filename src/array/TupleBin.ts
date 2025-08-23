import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";

export class TupleBinConstructor<T extends unknown[]> extends Bin<T> {
    public name: string;

    constructor(
        public readonly typesName: (types: Bin[]) => string,
        public readonly typeName: (type: Bin) => string,
        public readonly fixedName: (fixed: number) => string,
        public readonly fixedTypeName: (fixed: number, type: Bin) => string,
        public readonly baseName: string,
        public readonly types: Bin<T[number]>[] | null = null
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

        const result = base || <T>Array(length);

        for (let i = 0; i < length; i++) {
            result[i] = types[i].read(bind);
        }

        return result;
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

        if (strict && !Array.isArray(value)) return this.makeProblem(`Expected an array, got ${typeof value}`);

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
        let result = <T>Array(types.length);

        for (let i = 0; i < types.length; i++) {
            result[i] = types[i].sample;
        }

        return result;
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

    copy(init = true) {
        const o = <this>new TupleBinConstructor(
            this.typesName,
            this.typeName,
            this.fixedName,
            this.fixedTypeName,
            this.baseName,
            this.types
        );
        if (init) o.init();
        return o;
    };
}
