import {__def, Bin} from "../Bin";
import {StrampProblem} from "../StrampProblem";
import {BufferIndex} from "../BufferIndex";
import {SortedMap} from "../Utils";

export class StructBin<T> extends Bin<T> {
    sample = null;
    data = new SortedMap<string, Bin | null>((a, b) => a.localeCompare(b));
    name: string;

    constructor(public clazz: Function, public lengthBin: Bin<number> = null, public keyBin: Bin<string> = null) {
        super();
        this.name = this.clazz.name;
    };

    withKey(lengthBin: Bin<number>, keyBin: Bin<string>) {
        const bin = new StructBin(this.clazz, lengthBin, keyBin);
        bin.data = this.data.copy();
        return bin;
    };

    unsafeWrite(bind: BufferIndex, value: Readonly<T> | T): void {
        if (this.lengthBin) this.lengthBin.unsafeWrite(bind, this.data.size);
        for (const [name, bin] of this.data) {
            this.keyBin?.unsafeWrite(bind, name);
            (bin ?? __def.Stramp.getStruct(value[name])).unsafeWrite(bind, value[name]);
        }
    };

    read(bind: BufferIndex, base: T): T {
        if (!base) throw this.makeProblem("Expected a base when reading.");

        if (this.lengthBin) {
            const length = this.lengthBin.read(bind);
            for (let i = 0; i < length; i++) {
                const name = this.keyBin.read(bind);
                if (this.data.has(name)) {
                    base[name] = (this.data.get(name) ?? __def.Stramp.getStruct(base[name])).read(bind, base[name]);
                }
            }
            return base;
        }

        for (const [name, bin] of this.data) {
            if (bin === null) {
                __def.Stramp.getStruct(base[name]).read(bind, base[name]);
                continue;
            }
            base[name] = bin.read(bind, base[name]);
        }

        return base;
    };

    unsafeSize(value: Readonly<T> | T): number {
        let size = 0;
        if (this.lengthBin) size += this.lengthBin.unsafeSize(this.data.size);
        for (const [name, bin] of this.data) {
            if (this.keyBin) size += this.keyBin.unsafeSize(name);
            size += (bin ?? __def.Stramp.getStruct(value[name])).unsafeSize(value[name]);
        }
        return size;
    };

    findProblem(value: unknown, strict?: boolean): StrampProblem | void {
        if (typeof value !== "object" || value === null) return this.makeProblem("Expected an object");
        if (strict && !(value instanceof this.clazz)) return this.makeProblem(`Expected an instance of ${this.clazz.name}`);
        for (const [name, bin] of this.data) {
            if (!bin && (!value || typeof value !== "object" || !value.hasOwnProperty(name))) {
                return this.makeProblem(`Expected an object with a "${name}" property for field "${this.name}.${name}"`);
            }
            let problem = this.keyBin ? this.keyBin.findProblem(name, strict) : null;
            if (problem) return problem.shifted(`${this.name}.${name}`, this);
            problem = (bin ?? __def.Stramp.getStruct(value[name])).findProblem(value[name], strict);
            if (problem) return problem.shifted(`${this.name}.${name}`, this);
        }
    };

    adapt(value: T): T {
        const adapted: Partial<T> = {};
        for (const [name, bin] of this.data) {
            adapted[name] = (bin ?? __def.Stramp.getStruct(value[name])).adapt(value[name]);
        }
        return adapted as T;
    };
}