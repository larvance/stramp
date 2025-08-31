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
    private isLegacy = false;

    constructor(
        public structData: StructData, // not readonly because some people might want to use it recursively.
        public readonly classConstructor: ((obj: ExtractStruct<StructData>) => T),
        public readonly baseName: string | null,
        private _finished = true
    ) {
        super();
    };

    get finished() {
        return this._finished;
    };

    init() {
        const objName = `{ ${Object.keys(this.structData).map(i => {
            return `${i}${(<OptionalBin><unknown>this.structData[i]).isOptional ? "?" : ""}: ${this.structData[i].name}`;
        }).join(", ")} }`;
        this.name = this.baseName ?? objName;
        const newStructData = {};
        const keys = Object.keys(this.structData).sort();

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            let v = this.structData[key];
            if (!(v instanceof Bin)) v = __def.Stramp.getStrictTypeOf(v);
            newStructData[key] = v;
        }

        this.structData = <StructData>newStructData;

        return this;
    };

    unsafeWrite(bind: BufferIndex, value: T) {
        this.assertFinished();
        const structData = this.structData!;
        const keys = Object.keys(structData);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const type = structData[key];
            type.unsafeWrite(bind, value[key]);
        }
    };

    read(bind: BufferIndex, base: T | null = null): T {
        this.assertFinished();
        const structData = this.structData!;
        const keys = Object.keys(structData);
        const result = base || <StructData>{};

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const type = structData[key];
            result[key] = type.read(bind);
        }

        return base || this.classConstructor(<StructData>result);
    };

    unsafeSize(value: T): number {
        this.assertFinished();
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

    findProblem(value: unknown, strict = false) {
        this.assertFinished();
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
        this.assertFinished();
        const obj = {};
        const structData = this.structData!;
        const keys = Object.keys(structData);

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const type = structData[key];
            obj[key] = type.sample;
        }

        return this.classConstructor(<StructData>obj);
    };

    adapt(value: unknown): T {
        this.assertFinished();
        if (value === null || typeof value !== "object") value = {};

        const obj = {};
        const keys = Object.keys(value);

        for (const key of this.keys()) {
            const type = this.structData[key];
            obj[<string>key] = keys.includes(<string>key) ? type.adapt(value[key]) : type.sample;
        }

        return super.adapt(this.classConstructor(<ExtractStruct<StructData>>obj));
    };

    assertFinished() {
        if (!this.finished) throw new Error("This bind struct is not finished. " +
            "This bin is used on classes properties like `@myBindStruct.def(X.u8) x: number`. " +
            "If you already made a class like this, modern decorator interpreters might require" +
            " you to first instantiate the class like `new MyClass()`.");
    };

    keys() {
        this.assertFinished();
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
        const o = <ObjectStructBinConstructor<StructData & N>><unknown>this.copy(false);
        const data = d instanceof ObjectStructBinConstructor ? d.structData : d;

        o.structData = {...this.structData, ...data};
        o.init();
        return o;
    };

    excludeKeys<K extends (keyof StructData & string)[]>(...keys: K) {
        const o = this.copy(false);
        const structData = {};
        const keysToKeep = Object.keys(this.structData).filter(k => !keys.includes(k));

        for (let i = 0; i < keysToKeep.length; i++) {
            const key = keysToKeep[i];
            structData[key] = this.structData[key];
        }

        o.structData = <StructData>structData;
        o.init();
        return <ObjectStructBinConstructor<ExcludeKeys<StructData, K>>><unknown>o;
    };

    def(desc: Bin): (_: unknown, context: unknown) => void {
        this._finished = true;
        return (_: unknown, context: {
            name: string | symbol;
            addInitializer(init: Function): void;
        } | string) => {
            if (typeof context === "string" || typeof context === "symbol") {
                this.isLegacy = true;
                (<object>this.structData)[context] = desc;
                return;
            }
            context.addInitializer(() => {
                (<object>this.structData)[context.name] = desc;
            });
        };
    }

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

export function getBindStruct() {
    return new ObjectStructBinConstructor({}, o => o, "Object<unfinished>", false);
}
