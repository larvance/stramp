import X from "../src/Stramp";
import * as fs from "node:fs";

if (!fs.existsSync("players")) fs.mkdirSync("players");

class Vec3 {
    @X.def(X.f32) x = 0;
    @X.def(X.f32) y = 0;
    @X.def(X.f32) z = 0;

    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    };
}

class Player extends Vec3 {
    @X.def(X.f32) health = 100;

    @X.def velocity = new Vec3();

    get file() {
        return `players/${this.name}.sp`;
    };

    constructor(readonly name: string) {
        super();
        if (fs.existsSync(this.file)) {
            try {
                X.load(this, fs.readFileSync(this.file));
            } catch {
                console.error(`Failed to load player data for ${name}.sp`);
            }
        }
    };

    save() {
        fs.writeFileSync(this.file, X.save(this));
    };
}

const player = new Player("Player1");

player.x += 10;
player.y += 20;
player.z += 30;
player.velocity.x += 1; // will always reset back because we aren't saving it!
player.health *= 1.5;
console.log(player);

player.save();
