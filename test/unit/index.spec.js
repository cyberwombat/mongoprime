const test = require('ava')
const Loader = require('../../index')
const fixtures = require('../fixtures')

let loader = new Loader()

test.before(() => loader.startServer())

test.after(() => loader.stopServer())

test.serial('should load a single fixture', (t) => {
  return loader.clearAndLoad({ kittens: fixtures.kittens }).then(() => {
    return loader.getCurrentConnection().then(db => {
      return db.collection('kittens').find().toArray().then(kittens => {
        t.is(kittens.length, 4)
      }).then(() => {
        return loader.getCollections().then(names => {
          t.deepEqual(names, ['kittens'])
        })
      })
    })
  })
})

test.serial('should load multiple fixture', (t) => {
  return loader.clearAndLoad(fixtures).then(() => {
    return loader.getCurrentConnection().then(db => {
      return db.collection('kittens').find().toArray().then(kittens => {
        t.is(kittens.length, 4)
      }).then(() => {
        return loader.getCollections().then(names => {
          t.deepEqual(names.sort(), ['kittens', 'puppies'])
        })
      })
    })
  })
})
