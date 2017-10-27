const test = require('ava')
const { initProxy } = require('../../index')
const fixtures = require('../fixtures')
const { MongoClient } = require('mongodb')
const uuid = require('uuid')

test.before(async () => initProxy({ fixtures }))

test(async (t) => {
  let c = await MongoClient.connect(`mongodb://${process.env.MONGO_PRIMER_DB_HOST}:${process.env.MONGO_PRIMER_DB_PORT}/${uuid()}`)
  let collection = c.collection('puppies')
  await collection.insertOne({ name: 'Bo' })
  let count = await collection.find().count()
  t.is(count, 4)
})

test(async (t) => {
  let c = await MongoClient.connect(`mongodb://${process.env.MONGO_PRIMER_DB_HOST}:${process.env.MONGO_PRIMER_DB_PORT}/${uuid()}`)
  let collection = c.collection('puppies')
  let count = await collection.find().count()
  t.is(count, 3)
})

