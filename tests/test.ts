import X from "../src/Stramp";

const struct = X.bindStruct();

class Vec3 {
    @struct.def(X.f32) x = 0;
    @struct.def(X.f32) y = 0;
    @struct.def(X.f32) z = 0;

    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    };
}

class Player extends Vec3 {
    @struct.def(X.f32) health = 100;

    velocity = new Vec3();

    constructor(readonly name: string) {
        super(0, 0, 0);
    };
}

const player = new Player("hello");

player.x = 10;

player.velocity.y = 10;
player.health = 20;

const buffer = struct.serialize(player);

console.log(buffer);

const player2 = new Player("hello2");

struct.parse(buffer, player2);

console.log(player2);

