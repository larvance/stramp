import U32 from "./number/UInt32Bin";
import {Bin} from "./Bin";
import {S32} from "./string/LengthBasedStringBin";

export const DefaultStringBin: Bin<string> = S32;
export const SizeBin: Bin<number> = U32;