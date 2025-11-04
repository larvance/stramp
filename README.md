# Stramp

A powerful JavaScript/TypeScript library for efficient binary serialization and deserialization of any data type. Stramp
provides lossless conversion between JavaScript objects and binary buffers, with excellent performance and type safety.

## 🚀 Quick Start

### Installation

```bash
npm install stramp
```

### Basic Usage

```js
import X from "stramp"

// Serialize any data to binary
const data = {name: "John", age: 30, scores: [95, 87, 92]}
const buffer = X.serialize(data)

// Deserialize back to the original data
const restored = X.parse(buffer)
console.log(restored) // { name: "John", age: 30, scores: [95, 87, 92] }
```

## 📚 Table of Contents

<!-- TOC -->
* [Stramp](#stramp)
  * [🚀 Quick Start](#-quick-start)
    * [Installation](#installation)
    * [Basic Usage](#basic-usage)
  * [📚 Table of Contents](#-table-of-contents)
  * [🎯 Getting Started](#-getting-started)
    * [What is Stramp?](#what-is-stramp)
    * [Core Concepts](#core-concepts)
  * [🔢 Basic Types](#-basic-types)
    * [Numbers](#numbers)
    * [Strings](#strings)
    * [Booleans and Constants](#booleans-and-constants)
    * [Arrays and Collections](#arrays-and-collections)
  * [🏗️ Complex Data Structures](#-complex-data-structures)
    * [Objects](#objects)
    * [Maps](#maps)
    * [Tuples (Fixed-order arrays)](#tuples-fixed-order-arrays)
    * [Custom Types with Highway](#custom-types-with-highway)
  * [🎨 Advanced Features](#-advanced-features)
    * [Type Unions with `any`](#type-unions-with-any)
    * [Default Values](#default-values)
    * [Nullable Types](#nullable-types)
    * [Ignore Properties](#ignore-properties)
    * [Constants](#constants)
  * [⚡ Performance Optimization](#-performance-optimization)
    * [Structs vs Dynamic Objects](#structs-vs-dynamic-objects)
    * [Fixed-size vs Dynamic Arrays](#fixed-size-vs-dynamic-arrays)
    * [Memory-efficient Class Serialization](#memory-efficient-class-serialization)
  * [🔧 TypeScript Integration](#-typescript-integration)
    * [Type Inference](#type-inference)
    * [Decorators (Experimental)](#decorators-experimental)
    * [Multiple Struct Bindings](#multiple-struct-bindings)
  * [🌟 Real-World Examples](#-real-world-examples)
    * [Game Save System](#game-save-system)
    * [Network Protocol](#network-protocol)
    * [Database Serialization](#database-serialization)
  * [📖 API Reference](#-api-reference)
    * [Core Functions](#core-functions)
    * [Available Types](#available-types)
      * [Numbers](#numbers-1)
      * [Strings](#strings-1)
      * [Booleans & Constants](#booleans--constants)
      * [Collections](#collections)
      * [Objects & Classes](#objects--classes)
      * [Special](#special)
    * [Bin Methods](#bin-methods)
    * [Object Struct Methods](#object-struct-methods)
  * [🚨 Limitations & Best Practices](#-limitations--best-practices)
    * [Limitations](#limitations)
    * [Best Practices](#best-practices)
    * [Error Handling](#error-handling)
  * [🤝 Contributing](#-contributing)
  * [📄 License](#-license)
<!-- TOC -->

## 🎯 Getting Started

### What is Stramp?

Stramp is a binary serialization library that converts JavaScript data into compact binary format and back. Unlike JSON,
Stramp:

- **Preserves data types** (numbers, booleans, null, undefined, etc.)
- **More compact** than JSON (often 50-80% smaller)
- **Type-safe** with TypeScript support
- **Extensible** with custom serialization rules

### Core Concepts

**Bin**: A "Binary Data Converter" that handles serialization/deserialization of specific data types. Each Bin knows how
to convert its data type to/from binary.

**Struct**: A predefined object structure that defines exactly which properties to serialize and their types.

**Highway**: A way to transform data during serialization/deserialization.

## 🔢 Basic Types

### Numbers

```js
import X from "stramp"

// Integer types
X.u8.serialize(255)        // 8-bit unsigned (0-255)
X.u16.serialize(65535)     // 16-bit unsigned (0-65535)
X.u32.serialize(4294967295) // 32-bit unsigned
X.u64.serialize(18446744073709551615n) // 64-bit unsigned

X.i8.serialize(-128)       // 8-bit signed (-128 to 127)
X.i16.serialize(-32768)    // 16-bit signed
X.i32.serialize(-2147483648) // 32-bit signed
X.i64.serialize(-9223372036854775808n) // 64-bit signed

// Floating point
X.f32.serialize(3.14159)   // 32-bit float
X.f64.serialize(Math.PI)   // 64-bit float (recommended)

// Big integers
X.bigint.serialize(123456789012345678901234567890n)
X.ubigint.serialize(123456789012345678901234567890n) // unsigned
```

### Strings

```js
// Length-prefixed strings
X.string8.serialize("Hello")   // 1 byte length prefix (max 255 chars)
X.string16.serialize("Longer string") // 2 bytes length prefix
X.string32.serialize("Very long string...") // 4 bytes length prefix

// Null-terminated strings
X.cstring.serialize("Hello\0") // C-style null-terminated

// Aliases
X.s8.serialize("Hello")    // Same as string8
X.str16.serialize("Hello") // Same as string16
```

### Booleans and Constants

```js
// Booleans
X.bool.serialize(true)
X.bool.serialize(false)

// Constants (no data stored, just markers)
X.true.serialize(true)     // Always serializes to 0 bytes
X.false.serialize(false)   // Always serializes to 0 bytes
X.null.serialize(null)     // Always serializes to 0 bytes
X.undefined.serialize(undefined) // Always serializes to 0 bytes
X.zero.serialize(0)        // Always serializes to 0 bytes
X.NaN.serialize(NaN)      // Always serializes to 0 bytes
X.inf.serialize(Infinity) // Always serializes to 0 bytes
```

### Arrays and Collections

```js
// Dynamic arrays (any type)
const numbers = [1, 2, 3, 4, 5]
X.serialize(numbers) // Automatically detects types

// Typed arrays
const numberArray = X.u8.array()
numberArray.serialize([1, 2, 3, 4, 5])

// Fixed-size arrays
const fixedArray = X.u8.array(5)
fixedArray.serialize([1, 2, 3, 4, 5])

// Sets
const numberSet = X.u8.set()
numberSet.serialize(new Set([1, 2, 3, 4, 5]))

// TypedArrays
X.u8array.serialize(new Uint8Array([1, 2, 3]))
X.f32array.serialize(new Float32Array([1.1, 2.2, 3.3]))
```

## 🏗️ Complex Data Structures

### Objects

```js
// Dynamic objects (any properties)
const person = {
    name: "Alice",
    age: 25,
    hobbies: ["reading", "coding"]
}
X.serialize(person) // Automatically handles all types

// Typed objects
const personType = X.object.struct({
    name: X.string8,
    age: X.u8,
    hobbies: X.string8.array()
})

const buffer = personType.serialize(person)
const restored = personType.parse(buffer)
```

### Maps

```js
const userMap = new Map([
    ["alice", {age: 25, score: 95}],
    ["bob", {age: 30, score: 87}]
])

X.serialize(userMap) // Automatically handles Map

// Typed maps
const userType = X.map.struct({
    key: X.string8,
    value: X.object.struct({
        age: X.u8,
        score: X.u8
    })
})
```

### Tuples (Fixed-order arrays)

```js
// Tuple with specific types in order
const point = X.tuple(X.f64, X.f64, X.string8)
const data = [3.14, 2.71, "origin"]
const buffer = point.serialize(data)
const restored = point.parse(buffer) // [3.14, 2.71, "origin"]

// Alternative syntax
const point2 = X.f64.to(X.f64, X.string8) // Same as above
```

### Custom Types with Highway

```js
class Vector2D {
    constructor(x, y) {
        this.x = x
        this.y = y
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }
}

// Create a Bin that converts Vector2D to/from [x, y] array
const vectorBin = X.tuple(X.f64, X.f64).highway(
    vec => [vec.x, vec.y],           // serialize: Vector2D -> [x, y]
    coords => new Vector2D(coords[0], coords[1]) // deserialize: [x, y] -> Vector2D
)

const vec = new Vector2D(3, 4)
const buffer = vectorBin.serialize(vec)
const restored = vectorBin.parse(buffer) // Vector2D { x: 3, y: 4 }
```

## 🎨 Advanced Features

### Type Unions with `any`

```js
// Union of different types
const numberOrString = X.any.of(X.u8, X.string8)
numberOrString.serialize(42)    // number
numberOrString.serialize("42") // string

// Union of specific values
const status = X.any.ofValues("active", "inactive", "pending")
status.serialize("active") // Only these 3 values allowed
```

### Default Values

```js
// Provide default values for missing properties
const config = X.object.struct({
    port: X.u16.default(3000),
    host: X.string8.default("localhost"),
    debug: X.bool.default(false)
})

// Works with missing properties
const buffer = config.serialize({port: 8080}) // host and debug use defaults
const restored = config.parse(buffer) // { port: 8080, host: "localhost", debug: false }
```

### Nullable Types

```js
// Make any type nullable
const nullableString = X.string8.nullable()
nullableString.serialize("hello") // string
nullableString.serialize(null)    // null
```

### Ignore Properties

```js
// Skip serialization of certain properties
const user = X.object.struct({
    id: X.u32,
    name: X.string8,
    password: X.ignore, // Won't be serialized
    lastLogin: X.date
})
```

### Constants

```js
// Store constant values
const header = X.constant.new("STMP") // Always writes "STMP"
const version = X.constant.new(1)     // Always writes 1

const fileFormat = X.object.struct({
    magic: header,
    version: version,
    data: X.u8.array()
})
```

## ⚡ Performance Optimization

### Structs vs Dynamic Objects

```js
// ❌ Less efficient - dynamic type detection
const dynamic = X.serialize({
    x: 100,
    y: 200,
    name: "point"
})

// ✅ More efficient - predefined structure
const struct = X.object.struct({
    x: X.u8,
    y: X.u8,
    name: X.string8
})
const optimized = struct.serialize({x: 100, y: 200, name: "point"})
```

### Fixed-size vs Dynamic Arrays

```js
// ❌ Less efficient - stores length
const dynamic = X.u8.array()
dynamic.serialize([1, 2, 3, 4, 5])

// ✅ More efficient - no length stored
const fixed = X.u8.array(5)
fixed.serialize([1, 2, 3, 4, 5])
```

### Memory-efficient Class Serialization

```js
class Player {
    constructor(x, y, health) {
        this.x = x
        this.y = y
        this.health = health
    }
}

// ❌ Less efficient - stores property names
X.class.add(Player)
const buffer1 = X.serialize(new Player(100, 200, 50))

// ✅ More efficient - predefined structure
const PlayerType = X.object.struct({
    x: X.f32,
    y: X.f32,
    health: X.u8
}).withConstructor(obj => new Player(obj.x, obj.y, obj.health))

const buffer2 = PlayerType.serialize(new Player(100, 200, 50))
```

## 🔧 TypeScript Integration

### Type Inference

```ts
import X from "stramp"

// Automatic type inference
const userBin = X.object.struct({
    id: X.u32,
    name: X.string8,
    active: X.bool
})

type User = X.infer<typeof userBin>
// User = { id: number, name: string, active: boolean }

// Type-safe serialization
const user: User = {id: 1, name: "Alice", active: true}
const buffer = userBin.serialize(user) // TypeScript ensures correct types
```

### Decorators (Experimental)

```ts
import X, {def} from "stramp"

class GameEntity {
    @def(X.f32) x = 0
    @def(X.f32) y = 0
    @def(X.u8) health = 100

    // Properties without @def are ignored
    private internalState = "some value"

    constructor(x = 0, y = 0) {
        this.x = x
        this.y = y
    }
}

const entity = new GameEntity(10, 20)
const struct = X.getStruct(entity)
const buffer = struct.serialize(entity)
```

### Multiple Struct Bindings

```ts
import X from "stramp"

const networkBind = X.bindStruct()
const saveBind = X.bindStruct()

class Player {
    @networkBind.def(X.f32) x = 0
    @networkBind.def(X.f32) y = 0
    @saveBind.def(X.u32) id = 0
    @saveBind.def(X.string8) name = ""
    @networkBind.def(X.u8) @saveBind.def(X.u8) health = 100
}

const player = new Player()
player.x = 100
player.y = 200
player.id = 12345
player.name = "Alice"
player.health = 75

// Network packet (position + health only)
const networkData = networkBind.serialize(player)

// Save file (id + name + health only)
const saveData = saveBind.serialize(player)
```

## 🌟 Real-World Examples

### Game Save System

```ts
import X from "stramp"
import * as fs from "fs"

// Define game data structures
const GameState = X.object.struct({
    player: X.object.struct({
        position: X.tuple(X.f32, X.f32),
        health: X.u8,
        inventory: X.u16.array(),
        experience: X.u32
    }),
    world: X.object.struct({
        seed: X.u32,
        time: X.u64,
        weather: X.string8
    }),
    settings: X.object.struct({
        volume: X.f32,
        fullscreen: X.bool,
        language: X.string8
    })
})

class Game {
    private state: X.infer<typeof GameState>

    constructor() {
        this.state = {
            player: {
                position: [0, 0],
                health: 100,
                inventory: [],
                experience: 0
            },
            world: {
                seed: Math.floor(Math.random() * 1000000),
                time: BigInt(Date.now()),
                weather: "sunny"
            },
            settings: {
                volume: 0.8,
                fullscreen: false,
                language: "en"
            }
        }
    }

    save(filename: string) {
        const buffer = GameState.serialize(this.state)
        fs.writeFileSync(filename, buffer)
    }

    load(filename: string) {
        const buffer = fs.readFileSync(filename)
        this.state = GameState.parse(buffer)
    }
}
```

### Network Protocol

```ts
import X from "stramp"

// Define message types
const MessageTypes = X.any.ofValues("join", "move", "chat", "quit")

const NetworkMessage = X.object.struct({
    type: MessageTypes,
    timestamp: X.u64,
    data: X.any.of(
        // Join message
        X.object.struct({
            playerId: X.u32,
            name: X.string8
        }),
        // Move message
        X.tuple(X.f32, X.f32),
        // Chat message
        X.string8,
        // Quit message (no data)
        X.ignore
    )
})

class NetworkProtocol {
    static serialize(type: string, data: any) {
        return NetworkMessage.serialize({
            type,
            timestamp: BigInt(Date.now()),
            data
        })
    }

    static parse(buffer: Buffer) {
        return NetworkMessage.parse(buffer)
    }
}

// Usage
const joinMsg = NetworkProtocol.serialize("join", {
    playerId: 12345,
    name: "Alice"
})

const moveMsg = NetworkProtocol.serialize("move", [100.5, 200.3])
const chatMsg = NetworkProtocol.serialize("chat", "Hello everyone!")
const quitMsg = NetworkProtocol.serialize("quit", null)
```

### Database Serialization

```ts
import X from "stramp"

// Efficient database record format
const UserRecord = X.object.struct({
    id: X.u32,
    email: X.string8,
    passwordHash: X.string8,
    createdAt: X.u64,
    lastLogin: X.u64,
    isActive: X.bool,
    preferences: X.object.struct({
        theme: X.string8,
        notifications: X.bool,
        language: X.string8
    })
})

class UserDatabase {
    private records = new Map<number, Buffer>()

    saveUser(user: X.infer<typeof UserRecord>) {
        const buffer = UserRecord.serialize(user)
        this.records.set(user.id, buffer)
    }

    getUser(id: number): X.infer<typeof UserRecord> | null {
        const buffer = this.records.get(id)
        if (!buffer) return null
        return UserRecord.parse(buffer)
    }
}
```

## 📖 API Reference

### Core Functions

```js
// Main serialization/deserialization
X.serialize(value)           // Convert any value to Buffer
X.parse(buffer)             // Convert Buffer back to value

// Type detection
X.getTypeOf(value)          // Get appropriate Bin for value
X.getStrictTypeOf(value)    // Get exact Bin for value
```

### Available Types

#### Numbers

- `X.u8`, `X.u16`, `X.u32`, `X.u64` - Unsigned integers
- `X.i8`, `X.i16`, `X.i32`, `X.i64` - Signed integers
- `X.f32`, `X.f64` - Floating point
- `X.bigint`, `X.ubigint` - Big integers
- `X.number` - Auto-detected number type

#### Strings

- `X.string8`, `X.string16`, `X.string32` - Length-prefixed
- `X.cstring` - Null-terminated
- Aliases: `X.s8`, `X.s16`, `X.s32`, `X.str8`, `X.str16`, `X.str32`

#### Booleans & Constants

- `X.bool`, `X.boolean` - Boolean values
- `X.true`, `X.false` - Constant booleans
- `X.null`, `X.undefined` - Null/undefined constants
- `X.zero`, `X.bigZero` - Zero constants
- `X.NaN`, `X.inf`, `X.negInf` - Special number constants

#### Collections

- `X.array` - Dynamic arrays
- `X.set` - Sets
- `X.map` - Maps
- `X.tuple` - Fixed-order arrays
- TypedArrays: `X.u8array`, `X.f32array`, etc.

#### Objects & Classes

- `X.object` - Dynamic objects
- `X.class` - Class instances
- `X.date` - Date objects
- `X.regexp` - RegExp objects

#### Special

- `X.any` - Union types
- `X.ignore` - Skip serialization
- `X.constant` - Constant values
- `X.buffer` - Buffer objects

### Bin Methods

```js
const bin = X.u8

// Serialization
bin.serialize(value)        // Convert to Buffer
bin.parse(buffer)          // Convert from Buffer

// Type operations
bin.default(value)         // Set default value
bin.nullable()             // Make nullable
bin.array(size)           // Create array of this type
bin.set(size)             // Create set of this type

// Unions
bin.or(...otherBins)       // Union with other types
bin.orValue(value)         // Union with specific value

// Highways
bin.highway(write, read)   // Transform during serialization

// Size calculation
bin.getSize(value)         // Get serialized size
```

### Object Struct Methods

```js
const struct = X.object.struct({
    id: X.u32,
    name: X.string8
})

// Serialization
struct.serialize(obj)      // Serialize object
struct.parse(buffer)       // Deserialize to object

// Constructor binding
struct.withConstructor(fn) // Set constructor for deserialization

// Defaults
struct.default(obj)        // Set default object
```

## 🚨 Limitations & Best Practices

### Limitations

1. **Functions**: Cannot serialize functions unless explicitly registered
2. **Symbols**: Cannot serialize symbols
3. **Circular References**: Will cause infinite loops
4. **Class Instances**: Require explicit registration or struct definition

### Best Practices

1. **Use Structs**: Predefine object structures for better performance
2. **Choose Appropriate Types**: Use smallest type that fits your data
3. **Handle Errors**: Always wrap serialization in try-catch
4. **Version Your Data**: Include version numbers in your data structures
5. **Test Thoroughly**: Test serialization/deserialization with edge cases

### Error Handling

```js
try {
    const buffer = X.serialize(data)
    const restored = X.parse(buffer)
} catch (error) {
    if (error instanceof X.StrampProblem) {
        console.error("Serialization error:", error.message)
        console.error("Problem value:", error.value)
        console.error("Expected type:", error.expectedType)
    }
}
```

## 🤝 Contributing

Stramp is open source! Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Stramp** - Efficient binary serialization for JavaScript/TypeScript