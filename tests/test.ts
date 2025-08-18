import X from "../src/Stramp";

const x = X.any.of(X.any.of(X.u8, X.u16), X.i32);

const y = X.array.typed(x);