const { MongoClient } = require('mongodb')
const mkdirp = require('mkdirp')
const MongodbPrebuilt = require('mongodb-prebuilt')
const { isArray, castArray, values, intersection, compact, merge } = require('lodash')

module.exports = class MongoPrimer {
  constructor (options) {
    this.options = merge({
      port: 27018,
      host: 'localhost',
      database: null,
      path: './.db',
      drop: false, // Drop collections instead of emptying them (drop() vs remove({}))
      ignore: /^(system|local)\./ // Regex of collection names to ignore
    }, options)

    process.env.MOMGO_PRIMER_DB_PORT = this.options.port
    process.env.MOMGO_PRIMER_DB_HOST = this.options.host

    this.connections = {}
  }

  getDatabaseName () {
    const name = this.options.database ? this.options.database : `test_${Math.floor(Math.random() * 99999) + 100000}`
    process.env.MOMGO_PRIMER_DB_NAME = name
    return name
  }

  setOption (key, value) {
    this.options[key] = value
  }

  getMongoURI (databaseName) {
    return 'mongodb://' + this.options.host + ':' + this.options.port + '/' + databaseName
  }
  async clearCollections (collections) {
    const db = await this.getCurrentConnection()
    const names = await this.getCollections()

    collections = compact(castArray(collections))
    const filtered = collections.length ? intersection(names, castArray(collections)) : names
    return Promise.all(filtered.map(name => {
      return this.options.drop ? db.collection(name).drop() : db.collection(name).remove({})
    }))
  }

  async clearAndLoad (fixtures) {
    const collections = Object.keys(fixtures)

    await this.clearCollections(collections)
    return this.loadData(fixtures)
  }

  async startServer () {
    if (!process.env.MOMGO_PRIMER_INIT) {
      mkdirp.sync(this.options.path)

      const mongodHelper = new MongodbPrebuilt.MongodHelper(['--bind_ip', this.options.host, '--port', this.options.port, '--dbpath', this.options.path, '--storageEngine', 'ephemeralForTest'])

      await mongodHelper.run()
      process.env.MOMGO_PRIMER_INIT = true
    }
  }

  async getConnection (databaseName) {
    if (this.connections[databaseName]) {
      return Promise.resolve(this.connections[databaseName])
    } else {
      const databaseName = this.getDatabaseName()
      const connection = await MongoClient.connect(this.getMongoURI(databaseName))
      this.connections[databaseName] = connection
      return connection
    }
  }

  stopServer () {
    Object.keys(this.connections).map(databaseName => {
      this.connections[databaseName].close()
    })

    return new MongodbPrebuilt.MongoBins('mongo', ['--port', this.port, '--eval', "db.getSiblingDB('admin').shutdownServer()"]).run()
  }
  closeConnection () {
    if (this.client) return this.client.stop()
  }

  getCurrentConnection () {
    return this.getConnection(process.env.MOMGO_PRIMER_DB_NAME)
  }

  async getCollections () {
    const db = await this.getCurrentConnection()
    const names = await db.listCollections().toArray()
    return names.map(c => {
      return c.name
    }).filter(c => {
      return !c.match(this.options.ignore)
    })
  }

  async loadData (data) {
    const collectionNames = Object.keys(data)
    const db = await this.getCurrentConnection()
    this.connection = db
    const promises = collectionNames.map(name => {
      const collectionData = data[name]
      const items = isArray(collectionData) ? collectionData.slice() : values(collectionData)
      return this.connection.collection(name).insert(items)
    })

    return Promise.all(promises)
  }
}
