# Mongo Primer

## Description
A simple module for loading fixtures in Mongo for testing using mongo prebuilt and loads data in memory using ephemeralForTest as the storage engine.


## Installation

    npm i mongo-primer --save-dev

or:

    yarn add mongo-primer -D

## Usage

Setup a fixture named with your collection:

    // fixtures.js
    exports.kittens = [
      { name: 'Fluffy' },
      { name: 'Pookie' },
      { name: 'Lucifer' },
      { name: 'Bob' }
    ];

Then in your tests:

    const MongoPrimer = require('mongo-primer')
    const fixtures = require('./fixtures')
         
    let MongoPrimer = new MongoPrimer()
    test.before(t => MongoPrimer.startServer())
    test.after(t => MongoPrimer.stopServer())
    test.beforeEach(() => MongoPrimer.clearAndLoad(fixtures))
 

## API

#### 
`constructor(options)`
Options:

    port: 27018, // DB port
    host: 'localhost', // DB host
    database: 'test', // DB name
    path: './tempb/.data', // Mongo path to tmp metadata storage
    drop: false, // Drop collections instead of emptying them (drop() vs remove({}))
    ignore: /^(system|local)\./ // Regex of collection names to ignore

#### `clearAndLoad(fixtures)`
Clears given collections and loads fixtures.

#### `loadData(fixtures)`
Load fixture data without removing old entries.

#### `clearCollections([collections])`
Clear all collections or given collections by name if given

**Note:** collections prefixed by _system_ or _local_ are ignored.

## Fixture format

Fixtures should in the form of:
    
    const fixtures = {
        collectioname: [{ name: 'Entry 1'}, { name: 'Entry 2'}, ...]
    }

Multiple collections can be provided at once:

    const fixtures = {
        collection1: [],
        collection2: [],
        ...
    }

## Changelog

#### 0.1.0
- Add a check to prevent database clearing when in production mode.

#### 0.4.0
- Switched to mongo prebuild with mem storage.
- Switched to AVA for tests.

#### 0.4.1
- Renamed class
