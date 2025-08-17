import {Bin} from "../Bin";
import {BufferIndex} from "../BufferIndex";
import {Buffer} from "buffer";
import {Big0} from "../Utils";

class UBigIntBinConstructor extends Bin<bigint> {
    name = "ubi";
    sample = Big0;

    unsafeWrite(bind: BufferIndex, value: bigint) {
        let hex = BigInt(value).toString(16);
        if (hex.length % 2 === 1) hex = "0" + hex;

        const buf = Buffer.from(hex, "hex");

        bind.writeUInt16(buf.length);
        bind.writeBuffer(buf);
    };

    read(bind: BufferIndex) {
        const length = bind.readUInt16();

        return BigInt("0x" + bind.toString("hex", length));
    };

    unsafeSize(value: bigint) {
        let hex = value.toString(16);
        if (hex.length % 2 === 1) hex = "0" + hex;
        return hex.length / 2 + 2;
    };

    findProblem(value: unknown) {
        if (typeof value !== "bigint") return this.makeProblem("Expected a big integer");
        if (value < 0) return this.makeProblem("Expected a non-negative big integer");
    };

    adapt(value: unknown) {
        if (typeof value === "number") value = BigInt(value);
        else if (typeof value !== "bigint") value = Big0;
        const v = value as bigint;
        return super.adapt(v < Big0 ? -v : v);
    };
}

export default new UBigIntBinConstructor();