import {BufferIndex} from "../BufferIndex";
import {Buffer} from "buffer";
import {StringBin} from "./StringBin";

class CStringBinConstructor extends StringBin {
    name = "string";
    sample = "";
    lengthBytes = 0;

    unsafeWrite(bind: BufferIndex, value: string): void {
        bind.write(value);
        bind.push(0);
    };

    read(bind: BufferIndex): string {
        const start = bind.index;

        while (!bind.done && bind.incGet() !== 0) {
        }

        return bind.buffer.toString("utf8", start, bind.index - 1);
    };

    unsafeSize(value: string): number {
        return Buffer.byteLength(value, "utf8") + 1;
    };

    findProblem(value: unknown) {
        const p = this.findStringProblems(value);
        if (p) return p;

        const buf = Buffer.from(<string>value, "utf8");
        for (let i = 0; i < buf.length; i++) {
            if (buf[i] === 0) return this.makeProblem("Unexpected null byte", `[${i}]`);
        }
    };

    adapt(value: unknown) {
        const p = this.findStringProblems(value);
        if (p) p.throw();

        return super.adapt((<string>value).replaceAll("\0", ""));
    };
}

export default new CStringBinConstructor();