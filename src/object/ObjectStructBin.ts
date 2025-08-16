import {__def, Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import {OptionalBin} from "../OptionalBin";
import {IsOptionalBin} from "../Utils";

type ExtractStruct<SD extends Record<string, Bin>> = {
    [K in keyof SD as IsOptionalBin<SD[K]> extends true ? never : K]: SD[K]["__TYPE__"];
} & {
    [K in keyof SD as IsOptionalBin<SD[K]> extends true ? K : never]?: SD[K]["__TYPE__"];
};
type ExcludeKeys<Obj, Keys extends string[]> = {
    [K in keyof Obj as K extends Keys[number] ? never : K]: Obj[K];
};

export default class ObjectStructBinConstructor<
    StructData extends { [k: string | number]: Bin } = { [k: string | number]: Bin },
    T = ExtractStruct<StructData>
> extends Bin<T> {
    name = "";

    constructor(
        public structData: StructData, // not readonly because some people might want to use it recursively.
        public readonly classConstructor: ((obj: ExtractStruct<StructData>) => T),
        public readonly baseName: string | null
    ) {
        super();
    };

    init() {
        const objName = `{ ${Object.keys(this.structData).map(i => {
            return `${i}${(<OptionalBin><unknown>this.structData[i]).isOptional ? "?" : ""}: ${this.structData[i].name}`;
        }).join(", ")} }`;
        this.name = this.baseName ?? objName;
        const newStructData = <any>{};
        const keys = Object.keys(this.structData).sort();

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            let v = <any>this.structData[key];
            if (!(v instanceof Bin)) v = __def.Stramp.getStrictTypeOf(v);
            newStructData[key] = v;
        }

        this.structData = newStructData;

        return this;
    };

    unsafeWrite(bind: BufferIndex, value: T) {
        const structData = this.structData!;
        const keys = Object.keys(structData);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const type = structData[key];
            type.unsafeWrite(bind, value[key]);
        }
    };

    read(bind: BufferIndex, base: T | null = null): T {
        const structData = this.structData!;
        const keys = Object.keys(structData);
        const result = base || <any>{};

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const type = structData[key];
            result[key] = type.read(bind);
        }

        return base || this.classConstructor(result);
    };

    unsafeSize(value: T): number {
        const structData = this.structData!;
        const keys = Object.keys(structData);
        let size = 0;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const type = structData[key];
            size += type.unsafeSize(value[key]);
        }

        return size;
    };

    findProblem(value: any, strict = false) {
        if (value === null || typeof value !== "object") return this.makeProblem("Expected an object");

        const structData = this.structData!;
        const keys = Object.keys(structData);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const type = structData[key];
            const problem = type.findProblem(value[key], strict);
            if (problem) {
                return problem.shifted(`[keyed:${JSON.stringify(key)}]`, this);
            }
        }
    };

    get sample(): T {
        const obj = <any>{};
        const structData = this.structData!;
        const keys = Object.keys(structData);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const type = structData[key];
            obj[key] = type.sample;
        }

        return this.classConstructor(obj);
    };

    adapt(value: any): T {
        if (value === null || typeof value !== "object") value = {};

        const obj = <ExtractStruct<StructData>>{};
        const keys = Object.keys(value);

        for (const key of this.keys()) {
            const type = this.structData[key];
            obj[<keyof ExtractStruct<StructData>>key] = keys.includes(<string>key) ? type.adapt(value[key]) : type.sample;
        }

        return super.adapt(this.classConstructor(obj));
    };

    keys() {
        return <(keyof StructData)[]>Object.keys(this.structData);
    };

    withConstructor<N>(classConstructor: ((obj: ExtractStruct<StructData>) => N)) {
        const o = <ObjectStructBinConstructor<StructData, N>>new ObjectStructBinConstructor(
            this.structData,
            classConstructor,
            this.baseName
        );
        this.init();
        return o;
    };

    extend<N extends { [k: string]: Bin }>(d: N | ObjectStructBinConstructor<N>) {
        const o = <ObjectStructBinConstructor<StructData & N>><any>this.copy(false);
        const data = d instanceof ObjectStructBinConstructor ? d.structData : d;

        o.structData = <any>{...this.structData, ...data};
        o.init();
        return o;
    };

    excludeKeys<K extends (keyof StructData & string)[]>(...keys: K) {
        const o = this.copy(false);
        const structData = <any>{};
        const keysToKeep = Object.keys(this.structData).filter(k => !keys.includes(k));

        for (let i = 0; i < keysToKeep.length; i++) {
            const key = keysToKeep[i];
            structData[key] = this.structData[key];
        }

        o.structData = structData;
        o.init();
        return <ObjectStructBinConstructor<ExcludeKeys<StructData, K>>><unknown>o;
    };

    copy(init = true) {
        const o = <this>new ObjectStructBinConstructor(
            this.structData,
            this.classConstructor,
            this.baseName
        );
        if (init) o.init();
        return o;
    };
}