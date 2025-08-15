import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";

class RegExpBinConstructor extends Bin<RegExp> {
    isOptional = false as const;
    name = "regex";
    sample = / /;

    unsafeWrite(bind: BufferIndex, value: RegExp): void {
        Bin.any.unsafeWrite(bind, value.source);
    };

    read(bind: BufferIndex): RegExp {
        return Bin.any.read(bind);
    };

    unsafeSize(value: RegExp): number {
        return Bin.any.unsafeSize(value);
    };

    findProblem(value: any, _ = false) {
        if (!(value instanceof RegExp)) return this.makeProblem("Expected a RegExp");
    };

    adapt(value: any): RegExp {
        if (typeof value === "string") {
            const sp = value.split("/");
            if (sp.length >= 3 && !sp[0] && sp.at(-1).split("").every(i => ["g", "i", "m", "s"].includes(i))) {
                value = new RegExp(value.split("/").slice(1, -1).join("/"), sp.at(-1));
            } else value = new RegExp(value)
        }

        return super.adapt(value);
    };
}

export default new RegExpBinConstructor();