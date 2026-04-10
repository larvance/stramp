import assert from "node:assert/strict";
import X from "../src/Stramp";
import {Bin} from "../src/Bin";

type TestCase = {
    name: string;
    run: () => void | Promise<void>;
};

const tests: TestCase[] = [];

function test(name: string, run: TestCase["run"]) {
    tests.push({name, run});
}

function assertEquivalent(actual: unknown, expected: unknown, path = "value"): void {
    if (typeof expected === "number" && Number.isNaN(expected)) {
        assert.equal(Number.isNaN(actual as number), true, `${path}: expected NaN`);
        return;
    }

    if (expected instanceof Date) {
        assert.equal(actual instanceof Date, true, `${path}: expected Date`);
        assert.equal((actual as Date).getTime(), expected.getTime(), `${path}: date mismatch`);
        return;
    }

    if (expected instanceof RegExp) {
        assert.equal(actual instanceof RegExp, true, `${path}: expected RegExp`);
        assert.equal(String(actual), String(expected), `${path}: regexp mismatch`);
        return;
    }

    if (ArrayBuffer.isView(expected) && !(expected instanceof DataView)) {
        assert.equal(ArrayBuffer.isView(actual as object), true, `${path}: expected typed array/buffer`);
        assert.equal((actual as object).constructor, expected.constructor, `${path}: typed array constructor mismatch`);
        assert.deepEqual(
            Array.from(actual as unknown as Iterable<unknown>),
            Array.from(expected as unknown as Iterable<unknown>),
            `${path}: typed array values mismatch`
        );
        return;
    }

    if (expected instanceof Map) {
        assert.equal(actual instanceof Map, true, `${path}: expected Map`);
        assert.equal((actual as Map<unknown, unknown>).size, expected.size, `${path}: map size mismatch`);
        for (const [k, v] of expected.entries()) {
            assert.equal((actual as Map<unknown, unknown>).has(k), true, `${path}: missing map key ${String(k)}`);
            assertEquivalent((actual as Map<unknown, unknown>).get(k), v, `${path}.get(${String(k)})`);
        }
        return;
    }

    if (expected instanceof Set) {
        assert.equal(actual instanceof Set, true, `${path}: expected Set`);
        assert.deepEqual(Array.from(actual as Set<unknown>), Array.from(expected), `${path}: set values mismatch`);
        return;
    }

    if (Array.isArray(expected)) {
        assert.equal(Array.isArray(actual), true, `${path}: expected Array`);
        assert.equal((actual as unknown[]).length, expected.length, `${path}: array length mismatch`);
        for (let i = 0; i < expected.length; i++) {
            assertEquivalent((actual as unknown[])[i], expected[i], `${path}[${i}]`);
        }
        return;
    }

    if (expected && typeof expected === "object") {
        assert.equal(actual !== null && typeof actual === "object", true, `${path}: expected object`);
        const expectedKeys = Object.keys(expected as object).sort();
        const actualKeys = Object.keys(actual as object).sort();
        assert.deepEqual(actualKeys, expectedKeys, `${path}: object keys mismatch`);

        for (const key of expectedKeys) {
            assertEquivalent((actual as Record<string, unknown>)[key], (expected as Record<string, unknown>)[key], `${path}.${key}`);
        }
        return;
    }

    assert.equal(actual, expected, `${path}: primitive mismatch`);
}

function roundTrip<T>(value: T): T {
    return X.parse(X.serialize(value)) as T;
}

function roundTripBin<T>(bin: Bin<T>, value: T): T {
    return bin.parse(bin.serialize(value));
}

test("core: serialize/parse primitives and specials", () => {
    const values = [
        true,
        false,
        null,
        undefined,
        0,
        -1,
        255,
        65535,
        123.125,
        Infinity,
        -Infinity,
        NaN,
        123n,
        -456n,
        "",
        "hello"
    ];

    for (const value of values) {
        const parsed = roundTrip(value);
        assertEquivalent(parsed, value, `roundtrip(${String(value)})`);
    }
});

test("numbers: typed integer/float bins and boundaries", () => {
    assertEquivalent(roundTripBin(X.u8, 255), 255);
    assertEquivalent(roundTripBin(X.i8, -128), -128);
    assertEquivalent(roundTripBin(X.u16, 65535), 65535);
    assertEquivalent(roundTripBin(X.i16, -32768), -32768);
    assertEquivalent(roundTripBin(X.u32, 4294967295), 4294967295);
    assertEquivalent(roundTripBin(X.i32, -2147483648), -2147483648);
    assertEquivalent(roundTripBin(X.u64, 18446744073709551615n), 18446744073709551615n);
    assertEquivalent(roundTripBin(X.i64, -9223372036854775808n), -9223372036854775808n);
    assert.ok(Math.abs(roundTripBin(X.f32, 3.5) - 3.5) < 1e-6);
    assertEquivalent(roundTripBin(X.f64, Math.PI), Math.PI);
    assertEquivalent(roundTripBin(X.bigint, -123456789012345678901234567890n), -123456789012345678901234567890n);
    assertEquivalent(roundTripBin(X.ubigint, 123456789012345678901234567890n), 123456789012345678901234567890n);

    assert.throws(() => X.u8.serialize(256));
    assert.throws(() => X.ubigint.serialize(-1n));
});

test("strings: length-based and cstring behavior", () => {
    assertEquivalent(roundTripBin(X.string8, "abc"), "abc");
    assertEquivalent(roundTripBin(X.string16, "hello world"), "hello world");
    assertEquivalent(roundTripBin(X.string32, "a".repeat(300)), "a".repeat(300));
    assertEquivalent(roundTripBin(X.cstring, "hello"), "hello");

    assert.throws(() => X.cstring.serialize("hello\0world"));
});

test("collections: arrays, fixed arrays, sets, typed arrays, tuples", () => {
    const numbers = [1, 2, 3, 4, 5];
    assertEquivalent(roundTrip(numbers), numbers);
    assertEquivalent(roundTripBin(X.u8.array(), numbers), numbers);
    assertEquivalent(roundTripBin(X.u8.array(5), numbers), numbers);
    assert.throws(() => X.u8.array(5).serialize([1, 2]));

    const set = new Set([1, 2, 3]);
    assertEquivalent(roundTripBin(X.u8.set(), set), set);

    const u8a = new Uint8Array([1, 2, 3]);
    assertEquivalent(roundTripBin(X.u8array, u8a), u8a);
    const f32a = new Float32Array([1.25, 2.5, 3.75]);
    assertEquivalent(roundTripBin(X.f32array, f32a), f32a);

    const tuple = X.tuple(X.f64, X.f64, X.string8);
    assertEquivalent(roundTripBin(tuple, [3.14, 2.71, "origin"]), [3.14, 2.71, "origin"]);
    const tupleAlt = X.f64.to(X.f64, X.f64);
    assertEquivalent(roundTripBin(tupleAlt, [1.5, 2.5, 3.5]), [1.5, 2.5, 3.5]);
});

test("collections: extended typed-array coverage", () => {
    assertEquivalent(roundTripBin(X.u8clampedArray, new Uint8ClampedArray([0, 127, 255])), new Uint8ClampedArray([0, 127, 255]));
    assertEquivalent(roundTripBin(X.u16array, new Uint16Array([1, 65535])), new Uint16Array([1, 65535]));
    assertEquivalent(roundTripBin(X.u32array, new Uint32Array([1, 4294967295])), new Uint32Array([1, 4294967295]));
    assertEquivalent(roundTripBin(X.i16array, new Int16Array([-32768, 32767])), new Int16Array([-32768, 32767]));
    assertEquivalent(roundTripBin(X.i32array, new Int32Array([-2147483648, 2147483647])), new Int32Array([-2147483648, 2147483647]));
    assertEquivalent(roundTripBin(X.f64array, new Float64Array([Math.PI, Math.E])), new Float64Array([Math.PI, Math.E]));
    assertEquivalent(roundTripBin(X.u64array, new BigUint64Array([1n, 2n, 18446744073709551615n])), new BigUint64Array([1n, 2n, 18446744073709551615n]));
    assertEquivalent(roundTripBin(X.i64array, new BigInt64Array([-9223372036854775808n, 0n, 9223372036854775807n])), new BigInt64Array([-9223372036854775808n, 0n, 9223372036854775807n]));
});

test("parse: mutate provided base instances", () => {
    const objBase = {a: 0, b: 0};
    const objOut = X.object.parse(X.object.serialize({a: 10, b: 20}), objBase);
    assert.equal(objOut, objBase);
    assertEquivalent(objOut, {a: 10, b: 20});

    const arrBin = X.u8.array(3);
    const arrBase = [0, 0, 0];
    const arrOut = arrBin.parse(arrBin.serialize([4, 5, 6]), arrBase);
    assert.equal(arrOut, arrBase);
    assertEquivalent(arrOut, [0, 0, 0, 4, 5, 6]);

    const mapBase = new Map<string, number>();
    const mapBin = X.map.typed(X.string8, X.u8);
    const mapOut = mapBin.parse(mapBin.serialize(new Map([["x", 5], ["y", 9]])), mapBase);
    assert.equal(mapOut, mapBase);
    assert.equal(mapOut.get("x"), 5);
    assert.equal(mapOut.get("y"), 9);
});

test("objects: struct/default/nullable/ignore/constant", () => {
    const personType = X.object.struct({
        name: X.string8,
        age: X.u8,
        nick: X.string8.nullable(),
        debugOnly: X.ignore,
        version: X.constant.new(1)
    });

    const person = {
        name: "alice",
        age: 30,
        nick: "ally",
        debugOnly: undefined,
        version: 1
    };

    const restored = roundTripBin(personType, person);
    assertEquivalent(restored, {
        name: "alice",
        age: 30,
        nick: "ally",
        debugOnly: undefined,
        version: 1
    });

    assertEquivalent(roundTripBin(X.string8.nullable(), null), null);

    const config = X.object.struct({
        port: X.u16.default(3000),
        host: X.string8.default("localhost"),
        debug: X.bool.default(false)
    });
    assertEquivalent(roundTripBin(config, {port: 8080}), {port: 8080, host: "localhost", debug: false});
});

test("maps: dynamic map and typed map", () => {
    const dynamicMap = new Map<string, unknown>([
        ["a", 1],
        ["b", {ok: true}],
        ["c", [1, 2, 3]]
    ]);
    assertEquivalent(roundTrip(dynamicMap), dynamicMap);

    const typedMapBin = X.map.typed(
        X.string8,
        X.object.struct({
            age: X.u8,
            score: X.u8
        })
    );

    const typedMap = new Map([
        ["alice", {age: 25, score: 95}],
        ["bob", {age: 30, score: 87}]
    ]);
    assertEquivalent(roundTripBin(typedMapBin, typedMap), typedMap);
});

test("advanced: any unions and value unions", () => {
    const numberOrString = X.any.of(X.u8, X.string8) as Bin<number | string>;
    assertEquivalent(roundTripBin<number | string>(numberOrString, 42), 42);
    assertEquivalent(roundTripBin<number | string>(numberOrString, "42"), "42");

    const status = X.any.ofValues("active", "inactive", "pending");
    assertEquivalent(roundTripBin(status, "active"), "active");
    assert.throws(() => status.serialize("archived" as never));
});

test("advanced: highway conversion", () => {
    class Vector2D {
        constructor(public x: number, public y: number) {
        }
    }

    const vectorBin = X.tuple(X.f64, X.f64).highway(
        (vec: Vector2D) => [vec.x, vec.y] as [number, number],
        (coords: [number, number]) => new Vector2D(coords[0], coords[1])
    );

    const restored = roundTripBin(vectorBin, new Vector2D(3, 4));
    assert.equal(restored instanceof Vector2D, true);
    assertEquivalent(restored, new Vector2D(3, 4));
});

test("type resolution: class.add has priority over pinClassToBin", () => {
    class PriorityClass {
        x = 7;
    }

    const pinned = X.object.struct({x: X.u8});
    X.class.add(PriorityClass);
    X.pinClassToBin(PriorityClass, pinned);

    const detected = X.getTypeOf(new PriorityClass());
    assert.equal(detected, X.class);
});

test("type resolution: pinClassToBin and custom bins", () => {
    class Vec2 {
        constructor(public x: number, public y: number) {
        }
    }

    const vecBin = X.object.struct({x: X.f32, y: X.f32}).withConstructor(o => new Vec2(o.x, o.y));
    X.pinClassToBin(Vec2, vecBin);
    assert.equal(X.getTypeOf(new Vec2(1, 2)), vecBin);
    X.unpinClassFromBin(Vec2);

    class ForeignVec2 {
        constructor(public x: number, public y: number) {
        }
    }

    X.addCustomBin(vecBin);
    assert.equal(X.getTypeOf(new ForeignVec2(3, 4)), vecBin);
    X.removeCustomBin(vecBin);
    assert.equal(X.getTypeOf(new ForeignVec2(3, 4)), null);
});

test("core: type helper methods and zero-byte constants", () => {
    assert.equal(X.getNumberTypeOf(1), X.u8);
    assert.equal(X.getNumberTypeOf(256), X.u16);
    assert.equal(X.getNumberTypeOf(-1), X.i8);
    assert.equal(X.getNumberTypeOf(1.5), X.f64);

    assert.equal(X.getUnsignedTypeOf(255), X.u8);
    assert.equal(X.getIntegerTypeOf(-128), X.i8);
    assert.throws(() => X.getUnsignedTypeOf(-1));
    assert.throws(() => X.getIntegerTypeOf(1.1));

    assert.equal(X.true.getSize(true), 0);
    assert.equal(X.false.getSize(false), 0);
    assert.equal(X.null.getSize(null), 0);
    assert.equal(X.undefined.getSize(undefined), 0);
    assert.equal(X.zero.getSize(0), 0);
    assert.equal(X.NaN.getSize(NaN), 0);
});

test("objects: regexp/date/buffer and forbidden key failure", () => {
    const regex = /ab+c/gi;
    assertEquivalent(roundTrip(regex), regex);

    const date = new Date(1234567890);
    assertEquivalent(roundTrip(date), date);

    const buf = Buffer.from([1, 2, 3, 4]);
    const restored = roundTripBin(X.buffer, buf);
    assert.equal(Buffer.isBuffer(restored), true);
    assert.deepEqual([...restored], [...buf]);

    const dangerous = Object.create(null) as Record<string, unknown>;
    dangerous["__proto__"] = 1;
    const dangerousBuffer = X.object.serialize(dangerous as never);
    assert.throws(() => X.object.parse(dangerousBuffer));
});

test("failure cases: length-limited strings and tuple shape", () => {
    assert.throws(() => X.string8.serialize("a".repeat(300)));

    const tuple = X.tuple(X.u8, X.u8, X.u8);
    assert.throws(() => tuple.serialize([1, 2] as never));
    assert.throws(() => tuple.serialize([1, 2, 300] as never));
});

test("decorators: bindStruct supports inheritance and base parse", () => {
    const struct = X.bindStruct();

    class Vec3 {
        @struct.def(X.f32) x = 0;
        @struct.def(X.f32) y = 0;
        @struct.def(X.f32) z = 0;

        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }

    class Player extends Vec3 {
        @struct.def(X.f32) health = 100;
        constructor(readonly name: string) {
            super(0, 0, 0);
        }
    }

    const player = new Player("hello");
    player.x = 10;
    player.y = 20;
    player.health = 75;

    const buf = struct.serialize(player);
    const base = new Player("other");
    struct.parse(buf, base);

    assert.equal(base.name, "other");
    assertEquivalent({x: base.x, y: base.y, z: base.z, health: base.health}, {x: 10, y: 20, z: 0, health: 75});
});

test("decorators: def supports multiple symbols with and without explicit bin", () => {
    const symA = Symbol("symA");
    const symB = Symbol("symB");

    class Child {
        @X.def(X.u8) score = 0;
    }

    class Holder {
        @X.def(X.u8, symA, symB) id = 0;
        @X.def(symA, symB) child = new Child();
    }

    const value = new Holder();
    value.id = 12;
    value.child.score = 200;

    const aStruct = X.getStruct(value, symA);
    const aBase = new Holder();
    aStruct.parse(aStruct.serialize(value), aBase);
    assert.equal(aBase.id, 12);
    assert.equal(aBase.child.score, 200);

    const bStruct = X.getStruct(value, symB);
    const bBase = new Holder();
    bStruct.parse(bStruct.serialize(value), bBase);
    assert.equal(bBase.id, 12);
    assert.equal(bBase.child.score, 200);
});

test("errors: StrampProblem formatting is informative", () => {
    const userBin = X.object.struct({age: X.u8});
    const problem = userBin.findProblem({age: 300}, true);
    assert.ok(problem, "expected a problem");
    assert.ok(problem.toString().includes("[keyed:\"age\"]"));
    assert.ok(problem.toString().includes("Expected a number between"));
});

test("circular mode: shared references preserved in auto, duplicated in off", () => {
    const sharedStruct = X.object.struct({
        left: X.object,
        right: X.object
    });

    const shared = {n: 1};
    const payload = {left: shared, right: shared};

    const autoDecoded = sharedStruct.parse(
        sharedStruct.serialize(payload, {circular: "auto"}),
        null,
        {circular: "auto"}
    ) as { left: Record<string, unknown>; right: Record<string, unknown> };
    assert.equal(autoDecoded.left, autoDecoded.right, "auto mode should preserve shared identity");

    const offDecoded = sharedStruct.parse(
        sharedStruct.serialize(payload, {circular: "off"}),
        null,
        {circular: "off"}
    ) as { left: Record<string, unknown>; right: Record<string, unknown> };
    assert.notEqual(offDecoded.left, offDecoded.right, "off mode should decode as duplicated objects");
    assertEquivalent(offDecoded.left, offDecoded.right);
});

test("circular: object-key map/set identity links", () => {
    const rootStruct = X.object.struct({
        holder: X.object,
        map: X.map,
        set: X.setBin
    });

    const node: Record<string, unknown> = {name: "node"};
    const holder = {node};
    const map = new Map([[node, node]]);
    const set = new Set([node]);

    const decoded = rootStruct.parse(
        rootStruct.serialize({holder, map, set}, {circular: "auto"}), null, {circular: "auto"}
    ) as {
        holder: { node: Record<string, unknown> };
        map: Map<unknown, unknown>;
        set: Set<unknown>;
    };

    const decodedNode = decoded.holder.node;
    assert.equal(decoded.map.get(decodedNode), decodedNode);
    assert.equal(decoded.set.has(decodedNode), true);
});

test(
    "circular: single struct with object/array/map/set cycles and shared refs",
    () => {
        const circularStruct = X.object.struct({
            root: X.object,
            list: X.arrayBin,
            map: X.map,
            set: X.setBin
        });

        const root: Record<string, unknown> = {id: "root"};
        const list: unknown[] = [root];
        const map = new Map<unknown, unknown>();
        const set = new Set<unknown>();

        root.self = root;
        root.list = list;
        root.map = map;
        root.set = set;

        list.push(list, map, set, root);

        map.set("root", root);
        map.set("list", list);
        map.set("map", map);
        map.set("set", set);

        set.add(root);
        set.add(list);
        set.add(map);
        set.add(set);

        const payload = {root, list, map, set};
        const decoded = circularStruct.parse(
            circularStruct.serialize(payload, {circular: "auto"}),
            null,
            {circular: "auto"}
        ) as {
            root: Record<string, unknown>;
            list: unknown[];
            map: Map<unknown, unknown>;
            set: Set<unknown>;
        };

        assert.equal(decoded.root, decoded.root.self, "root.self should point back to root");
        assert.equal(decoded.list[0], decoded.root, "list[0] should reference root");
        assert.equal(decoded.root.list, decoded.list, "root.list should reference decoded list");
        assert.equal(decoded.root.map, decoded.map, "root.map should reference decoded map");
        assert.equal(decoded.root.set, decoded.set, "root.set should reference decoded set");

        assert.equal(decoded.map.get("root"), decoded.root, "map(root) should reference root");
        assert.equal(decoded.map.get("list"), decoded.list, "map(list) should reference list");
        assert.equal(decoded.map.get("map"), decoded.map, "map(map) should self-reference");
        assert.equal(decoded.map.get("set"), decoded.set, "map(set) should reference set");

        assert.equal(decoded.set.has(decoded.root), true, "set should contain root");
        assert.equal(decoded.set.has(decoded.list), true, "set should contain list");
        assert.equal(decoded.set.has(decoded.map), true, "set should contain map");
        assert.equal(decoded.set.has(decoded.set), true, "set should contain itself");
    }
);

async function run() {
    let passed = 0;

    for (const t of tests) {
        try {
            await t.run();
            passed++;
            console.log(`PASS ${t.name}`);
        } catch (error) {
            console.error(`FAIL ${t.name}`);
            throw error;
        }
    }

    console.log(`\n${passed}/${tests.length} tests passed.`);
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
