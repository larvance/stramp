import X, {def} from "../src/Stramp";

class Vec3 {
    @def(X.f32) x = 0;
    @def(X.f32) y = 0;
    @def(X.f32) z = 0;

    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    };
}

class Player {
    @def(X.f32) health = 100;

    velocity = new Vec3();

    constructor(readonly name: string) {
    };
}

const player = new Player("hello");

const struct = X.getStruct(player);

const buffer = struct.serialize(player);

const player2 = new Player("hello2");

struct.parse(buffer, player2);

console.log(player2);