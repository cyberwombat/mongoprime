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
         
    let loader = new MongoPrimer()
    test.before(t => loader.startServer())
    test.after(t => loader.stopServer())
    test.beforeEach(() => loader.clearAndLoad(fixtures))
 

## API

#### `constructor(options)`
Options:

    port: 27018, // DB port
    host: 'localhost', // DB host
    database: 'test', // DB name
    path: './.db', // Mongo path to tmp metadata storage
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

## Parallel testing
In order to accomodate parallel testing a new database is can be created on a per test basis. The name, port and host are loaded in the environment vsariables which can be used to connect to Mongo in you app.

    process.env.MOMGO_PRIMER_DB_PORT
    process.env.MOMGO_PRIMER_DB_HOST
    process.env.MOMGO_PRIMER_DB_NAME

If no database name is provided in the constructor then a new name will be created and assigned to `process.env.MOMGO_PRIMER_DB_NAME` upon calling `clearAndLoad`. This function will need to be moved from the `beforeEach` call to the individual tests that require a db connection:

    t('My test', t => {
       loader.clearAndLoad(fixtures)
       // The actual test
    })

The only change required in your app is to set the test database name to use `process.env.MOMGO_PRIMER_DB_NAME`:

Ex:

`mongodb://${process.env.MOMGO_PRIMER_DB_HOST}:${process.env.MOMGO_PRIMER_DB_PORT}/${process.env.MOMGO_PRIMER_DB_NAME}`

## Changelog

#### 0.1.0
- Add a check to prevent database clearing when in production mode.

#### 0.4.0
- Switched to mongo prebuild with mem storage.
- Switched to AVA for tests.

#### 0.4.1
- Renamed class

### 0.5.0
- Renamed tmp dir
- Support for per test database naming for parallel tests.
