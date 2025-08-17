import {__def, Bin} from "../Bin";
import type {BufferIndex} from "../Stramp";

export class AnyValueBinConstructor<K extends unknown[], T extends K[number] = K[number]> extends Bin<T> {
    name = "any";

    constructor(public values: K, public idBin = __def.Stramp.getTypeOf(values.length), public idBinSize = idBin.unsafeSize(0)) {
        super();
        this.name = `${values.join(" | ")}`;
    };

    unsafeWrite(bind: BufferIndex, value: T) {
        const id = this.values.indexOf(value);
        this.idBin.unsafeWrite(bind, id);
    };

    read(bind: BufferIndex) {
        const id = this.idBin.read(bind);
        return <T>this.values[id];
    };

    unsafeSize(_: T) {
        return this.idBinSize;
    };

    findProblem(value: unknown, _?: boolean) {
        if (!this.values.includes(value)) return this.makeProblem("Unsupported value");
    };

    get sample(): never {
        throw new Error("Cannot make a sample for a AnyValueBin, this was most likely caused by instantiating a new struct that includes an AnyValueBin.");
    };

    copy() {
        const o = <this>super.copy();
        (<{ values: unknown }>o).values = this.values.slice();
        o.idBin = this.idBin;
        o.idBinSize = this.idBinSize;
        return o;
    };
}