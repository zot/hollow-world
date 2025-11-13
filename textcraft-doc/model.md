# TextCraft Model.ts - Architecture Documentation

## Overview

`model.ts` is the core data model for the TextCraft MUD (Multi-User Dungeon) engine. It implements a graph-based object system where "Things" (objects in the game world) can have associations with other Things, forming a flexible and extensible world model.

## Core Concepts

### 1. Things - The Fundamental Entity

A **Thing** represents any object in the MUD world:
- Players/Characters (Person)
- Rooms/Locations
- Items/Objects
- Links (connections between rooms)
- Containers
- Generators (objects that create other objects)

Every Thing has:
- A unique **numeric ID** (thingId)
- Properties (name, description, article, etc.)
- **Associations** to other Things
- A **prototype** (for inheritance)

### 2. The World Container

The **World** class manages:
- All Things in the game
- User accounts
- Extensions (code modules)
- Persistence to IndexedDB
- Special Things like lobby, limbo, and prototypes

## How Things Get Their IDs

### ID Assignment Process

**Initial Creation (line 604):**
```typescript
constructor(name: string, stg: MudStorage) {
    // ...
    this.nextId = 0  // Start at 0
    // ...
}
```

**Creating a New Thing (lines 1286-1297):**
```typescript
createThing(name: string, description?) {
    const t = new Thing(this, this.nextId++, name, description)
    // nextId is incremented AFTER use (post-increment)
    // So first Thing gets id=0, next gets id=1, etc.

    t.world = this
    if (this.limbo) t.assoc.location = this.limbo
    if (this.thingProto) t.setPrototype(this.thingProto)
    this.thingCache.set(t.id, t)
    this.watcher?.(t)
    t.originalSpec = null
    this.stamp(t)
    return t
}
```

**Thing Constructor (lines 334-340):**
```typescript
constructor(world: World, id: number, name: string, description?: string) {
    this.world = world
    this._id = id  // ID is directly assigned from parameter
    this.fullName = name
    if (typeof description !== 'undefined') this._description = description
    this.makeProxies()
}
```

### ID Sequence

1. **New World**: `nextId` starts at 0
2. **First Thing Created**: Gets ID 0, `nextId` becomes 1
3. **Second Thing Created**: Gets ID 1, `nextId` becomes 2
4. And so on...

### Standard Things (created in initDb, lines 634-642)

The initial world setup creates these fundamental Things in order:
- ID 0: **Limbo** - Default location for orphaned objects
- ID 1: **Lobby** - Starting location for new players
- ID 2: **Hall of Prototypes** - Container for prototype objects
- ID 3: **thing** (thingProto) - Base prototype for all Things
- ID 4: **link** (linkProto) - Prototype for links between rooms
- ID 5: **room** (roomProto) - Prototype for room locations
- ID 6: **generator** (generatorProto) - Prototype for generators
- ID 7: **container** (containerProto) - Prototype for containers
- ID 8: **person** (personProto) - Prototype for player characters

### Loading from Storage (lines 723-746)

When loading an existing world from IndexedDB:
```typescript
async useInfo(info) {
    // ... load all Things from database ...
    this.nextId = info.nextId  // Restore the counter
    // This ensures new Things don't reuse existing IDs
}
```

The saved `info` object contains the `nextId` value, which is the next available ID. This prevents ID conflicts when creating new Things in a loaded world.

## Associations System

### What are Associations?

Associations are **named relationships** between Things. They're stored as tuples:
```typescript
_associations: [string, thingId][]  // Array of [propertyName, targetId]
```

### Common Association Types

- **location**: Where this Thing is located
- **contents**: Things contained by this Thing (reverse of location)
- **linkOwner**: For links, the room that owns this link
- **otherLink**: For links, the destination link
- **keys**: Things that can unlock this Thing

### Association Proxies

The model provides multiple ways to access associations through proxy objects:

#### 1. **assoc** - Returns Thing objects
```typescript
thing.assoc.location  // Returns the Thing object where this thing is located
thing.assoc.location = otherRoom  // Move this thing to otherRoom
```

#### 2. **assocMany** - Returns arrays of Things
```typescript
thing.assocMany.contents  // Returns array of all Things in this container
```

#### 3. **assocId** - Returns Thing IDs (numbers)
```typescript
thing.assocId.location  // Returns the numeric ID of the location
```

#### 4. **assocIdMany** - Returns arrays of IDs
```typescript
thing.assocIdMany.contents  // Returns array of IDs of contained Things
```

#### 5. **refs** - Reverse lookup (what references this Thing)
```typescript
room.refs.location  // Returns all Things that have location=room
```

#### 6. **specProxy**, **specAssoc**, **specAssocMany**, **specRefs**
These are "specification proxies" that access properties with underscore prefixes and provide a development/debugging view of the object.

### How Associations Work

**Setting an Association (lines 155-165):**
```typescript
set(prop: string, tid: thingId | Thing, m2m = false) {
    const id = idFor(tid)  // Convert Thing to ID

    if (id == null) return this.dissociateNamed(prop)
    this.checkAssociations()  // Copy-on-write for prototype safety
    if (!this.has(prop, id)) {
        if (!m2m && !this.many) this.dissociateNamed(prop, false)
        this.thing._associations.push([prop, id])  // Add the tuple
        this.changedAssociations()  // Update index
    }
}
```

**Getting Associations (lines 182-184):**
```typescript
allNamed(prop: string): Thing[] {
    return this.thing.world.getThings(this.allIdsNamed(prop))
}
```

The system:
1. Finds all tuples with matching property name
2. Extracts the IDs
3. Looks up the actual Thing objects from the World's cache

## Prototype-Based Inheritance

Things use JavaScript prototype inheritance:

```typescript
setPrototype(t: Thing) {
    if (t) {
        this._prototype = t.id as thingId
        (this as any).__proto__ = t  // Set JavaScript prototype
        if (!t.hasOwnProperty('Constructor')) {
            t.constructor = (function() { })
            t.constructor.prototype = t
        }
    }
}
```

This allows Things to inherit properties and methods from their prototype Thing.

## SpecProxy - Development View

The **SpecProxyHandler** (lines 85-114) provides an alternate view of Things:
- Properties accessed without underscore prefix automatically get `_` prepended
- Properties starting with `!` are accessed literally (without `_` prefix)
- Provides access to association proxies via `assoc`, `assocMany`, `refs` properties
- Used for specification/development, not runtime game logic

## Storage and Persistence

### IndexedDB Structure

The system uses IndexedDB with multiple object stores per world:
- **Things Store**: All Thing objects (by ID)
- **Users Store**: User accounts (by name)
- **Extensions Store**: Code extensions (by ID)

### Caching

Two-level caching system:
```typescript
thingCache: Map<thingId, Thing>  // In-memory Thing objects
userCache: Map<string, any>       // In-memory user accounts
```

### Dirty Tracking

Changes are tracked via:
```typescript
transactionThings: Set<Thing>  // Things modified in current transaction
```

Modified Things are saved to IndexedDB when `store()` or `storeDirty()` is called.

## Extensions

**Extensions** (lines 33-52) are JavaScript modules that can:
- Add custom behavior to Things
- Hook into world events
- Extend the MUD engine functionality

Extensions have:
- Unique ID
- Name
- Source code text
- SHA-256 hash (for integrity)
- Lifecycle hooks (`onLoggedIn`, `succeed`)

## Key Methods

### World Class

- **createThing(name, description)**: Create a new Thing with next available ID
- **getThing(id)**: Retrieve Thing by ID from cache/storage
- **getThings(ids[])**: Retrieve multiple Things
- **putThing(thing)**: Save Thing to storage
- **createUser(name, password, admin)**: Create user account
- **initDb()**: Initialize new world with standard Things
- **store()**: Persist all changes to IndexedDB

### Thing Class

- **setPrototype(thing)**: Set prototype for inheritance
- **get/set fullName**: Parse and set name with article
- **makeProxies()**: Initialize all association proxy objects

### AssociationIdAccessor Class

- **get(prop)**: Get associated Thing(s) by property name
- **set(prop, thing)**: Create association
- **has(prop, thing)**: Check if association exists
- **dissociate(prop, thing)**: Remove association
- **refs(prop)**: Find all Things that reference this Thing

## Summary

The TextCraft model implements a flexible object-graph database where:

1. **Things are numbered sequentially** starting from 0, with `nextId` tracking the next available ID
2. **Associations are bidirectional**: You can navigate from A→B and query B→A (via refs)
3. **Prototypes provide inheritance**: Things can share behavior and properties
4. **Proxies simplify access**: Multiple proxy types provide convenient ways to work with associations
5. **Persistence is transparent**: Changes are cached and saved to IndexedDB
6. **IDs are stable**: Once assigned, a Thing's ID never changes, even across save/load cycles

This architecture enables a rich, persistent MUD world where objects can have complex relationships while maintaining referential integrity through the ID system.
