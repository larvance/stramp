import {__def, Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";

class RegExpBinConstructor extends Bin<RegExp> {
    name = "regex";
    sample = / /;

    unsafeWrite(bind: BufferIndex, value: RegExp): void {
        __def.Stramp.cstring.unsafeWrite(bind, value.toString());
    };

    read(bind: BufferIndex): RegExp {
        return string2regex(__def.Stramp.cstring.read(bind));
    };

    unsafeSize(value: RegExp): number {
        return __def.Stramp.cstring.unsafeSize(value.toString());
    };

    findProblem(value: unknown) {
        if (!(value instanceof RegExp)) return this.makeProblem("Expected a RegExp");
    };

    adapt(value: unknown): RegExp {
        if (typeof value === "string") return string2regex(value);
        return super.adapt(value);
    };
}

function string2regex(str: string) {
    const sp = str.split("/");
    if (sp.length >= 3 && !sp[0] && sp.at(-1).split("").every(i => ["g", "i", "m", "s"].includes(i))) {
        return new RegExp(sp.slice(1, -1).join("/"), sp.at(-1));
    } else {
        return new RegExp(str);
    }
}

export default new RegExpBinConstructor();