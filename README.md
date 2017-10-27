# MongoPrime

## Description
A module for loading fixtures in Mongo for parallel testing using MongoDB prebuilt and loading data in memory using ephemeralForTest as the storage engine.

MongoPrime has support for parallel testing such as found in [AVA](https://github.com/avajs/ava). It achieves this by creating a proxy that listens to DB requests from your code and determines if the fixtures need to be loaded. A unique database is created for each test. 

## Installation

    npm i mongoprime --save-dev

or:

    yarn add mongoprime -D

## Usage

In order for this to work you must create a random database name in your code for each test. The database host and port are avalable through the `env` variaables `MONGO_PRIMER_DB_HOST` and `MONGO_PRIMER_DB_PORT` if you load your code during the tests. Else they can be hardcoded (defaults to 127.0.0.1:27018 - can be changed in runtime options).


Example:

    // yourcode.js
    const uuid = require('uuid') // you can use any random method you prefer
    const connection = `mongodb://${process.env.MONGO_PRIMER_DB_HOST}:${process.env.MONGO_PRIMER_DB_PORT}/${uuid()}`
    // console.log(connection) // ex: mongodb://127.0.0.1:59971/f3abdd14-dce4-4b0c-8db1-5716177aa9b2

In your test, initialize the proxy in your `before` call (It will ensure it is loaded just once even when used with AVA which calls `before` for each test file).

    // test.js
    const { initProxy } = require('mongoprime')
    const fixtures = require('./fixtures.js')
    test.before(async (t) => initProxy({ fixtures })
    

In some cases your code may be loaded using `require` and you "random" database name will be the same for each test. You can turn debug on to show a log and verify that you are seeing multiple databases being primed for all your tests:

    DEBUG=mongoprime yarn test

Look for multiple entries such as:

    mongoprime Priming 1169f9ef-7803-49f8-890c-5af0d4f78eba

If you find that your tests do not show different generated name you will need to clear the require cache with some of the relevant modules such as:

- [clear-module](https://github.com/sindresorhus/clear-module)
- [import-fresh](https://github.com/sindresorhus/import-fresh)
- [exige](https://github.com/cyberwombat/exige) (works with `node-config`)

*Note*: requires `node >= 7.6.0`

## Fixture format

Fixtures should in the form of:
    
    const fixtures = {
        collectionName: [{ name: 'Entry 1'}, { name: 'Entry 2'}, ...]
    }

Multiple collections can be provided at once:

    const fixtures = {
        collection1: [],
        collection2: [],
        ...
    }

You can use `ObjectId` to establish relationships:

    // fixtures.js
    const { ObjectId } = require('mongoprimer') 
    const users = [{ 
        _id: ObjectId()
        name: 'Harry Potter'
    }, { 
        _id: ObjectId(),
        name: 'Voldermort'
    }]

    const horcruxes = [{
        name: 'diadem'
        user: users[0]._id
    }]

    const fixtures = { users, horcruxes }

    module.exports = fixtures


## API

#### `initProxy(options)`
Options:
    
    fixtures: {}, // Fixture collection
    host: '127.0.0.1', // Proxy host
    port: 27018, // Proxy port
    ignore: ['system', 'admin', 'local'], // Collections to ignore
    path: null // Path for mongo metadata - defaults to randomly generated systm tmp dir
