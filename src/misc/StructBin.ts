import {__def, Bin} from "../Bin";
import {StrampProblem} from "../StrampProblem";
import {BufferIndex} from "../BufferIndex";
import {StructSymbol} from "../Stramp";

export class StructBin<T> extends Bin<T> {
    name: string;
    sample = null;

    constructor(self: object, public data: Record<string, Bin | null>) {
        super();
        this.name = self.constructor.name;

        for (const [name, bin] of Object.entries(this.data)) {
            if (!bin && !(StructSymbol in self[name])) {
                throw new Error(
                    `Class struct field @def ${name} was initialized, but no value with a @def was provided for "${name}".`
                );
            }
        }
    };

    unsafeWrite(bind: BufferIndex, value: Readonly<T> | T): void {
        for (const [name, bin] of Object.entries(this.data)) {
            (bin ?? __def.Stramp.getStruct(value[name])).unsafeWrite(bind, value[name]);
        }
    };

    read(bind: BufferIndex, base: T): T {
        if (!base) throw this.makeProblem("Expected a base when reading.");

        for (const [name, bin] of Object.entries(this.data)) {
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
        for (const [name, bin] of Object.entries(this.data)) {
            size += (bin ?? __def.Stramp.getStruct(value[name])).unsafeSize(value[name]);
        }
        return size;
    };

    findProblem(value: unknown, strict?: boolean): StrampProblem | void {
        for (const [name, bin] of Object.entries(this.data)) {
            const problem = (bin ?? __def.Stramp.getStruct(value[name])).findProblem(value[name], strict);
            if (problem) return problem.shifted(`${this.name}.${name}`, this);
        }
    };

    adapt(value: T): T {
        const adapted: Partial<T> = {};
        for (const [name, bin] of Object.entries(this.data)) {
            adapted[name] = (bin ?? __def.Stramp.getStruct(value[name])).adapt(value[name]);
        }
        return adapted as T;
    };
}