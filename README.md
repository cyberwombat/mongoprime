# Mongo Primer

## Description
A simple  module for loading fixtures in Mongo for testing.

## Installation

    npm i --save-dev mongo-primer

## Usage

Setup a fixture named with your collection


    // fixtures.js
    exports.kittens = [
      { name: 'Fluffy' },
      { name: 'Pookie' },
      { name: 'Lucifer' },
      { name: 'Bob' }
    ];

Then in your tests:

    import Loader from 'mongo-primer'
    import fixtures from './fixtures'
    
    let loader

    before(() => {
      loader = new Loader({ uri: 'mongodb://127.0.0.1/mongoloader' })
    })

    beforeEach(() => {
      return loader.clearAndLoad(fixtures)
    })

    after(() => {
      return loader.closeConnection()
    })


## API

####`clearAndLoad(fixtures)`
Clears given collections and loads fixtures.

####`loadData(fixtures)`
Load fixture data without removing old entries.

####`clearCollections([collections])`
Clear all collections or given collections by name if given

**Note:** collections prefixed by _system_ or _local_ are ignored. Additionally, as a safety measure, nothing will happen in production mode (not that this has _ever_ happened to me...)

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

## Todo
This is a preliminary release. Needs more tests.

## Changelog

####0.1.0
- Add a check to prevent database clearing when in production mode
