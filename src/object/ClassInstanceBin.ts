import {__def, Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import ObjectBin from "./ObjectBin";
import UInt8Bin from "../number/UInt8Bin";

type EmptyClassType = { new(): unknown };

class ClassInstanceBinConstructor<
    K extends EmptyClassType[],
    T extends InstanceType<K[number]> = InstanceType<K[number]>
> extends Bin<T> {
    name = "date";
    classes: EmptyClassType[] = [];
    numBin: Bin<number> = UInt8Bin;
    numBinSize = 1;

    add<V extends EmptyClassType[]>(...classes: V) {
        this.classes.push(...classes);
        this.classes = this.classes.sort((a, b) => a.name < b.name ? -1 : 1);
        this.numBin = __def.Stramp.getTypeOf(this.classes.length);
        this.numBinSize = this.numBin.unsafeSize(1);
        return <ClassInstanceBinConstructor<[...V, ...K]>><unknown>this;
    };

    unsafeWrite(bind: BufferIndex, value: T): void {
        this.numBin.unsafeWrite(bind, this.classes.indexOf(<EmptyClassType><unknown>value.constructor));
        ObjectBin.unsafeWrite(bind, value);
    };

    read(bind: BufferIndex, base = null): T {
        const index = this.numBin.read(bind);
        const obj = ObjectBin.read(bind, base);
        const inst = new this.classes[index];
        Object.assign(inst, obj);
        return <T>inst;
    };

    unsafeSize(value: unknown): number {
        return this.numBinSize + ObjectBin.unsafeSize(value);
    };

    findProblem(value: unknown, strict = false) {
        if (value === null || typeof value !== "object") return this.makeProblem("Expected an object");

        const index = this.classes.indexOf(<EmptyClassType>value.constructor);
        if (index === -1) return this.makeProblem(`Expected one of ${this.classes.map(c => c.name).join(", ")}`);

        const problem = ObjectBin.findProblem(value, strict);
        if (problem) return problem;
    };

    get sample(): never {
        throw new Error("Cannot make a sample for a ClassInstanceBin, this was most likely caused by instantiating a new struct that includes a ClassInstanceBin.");
    };
}

export default new ClassInstanceBinConstructor();