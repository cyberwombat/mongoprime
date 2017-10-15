const { MongoClient } = require('mongodb')
const mkdirp = require('mkdirp')
const MongodbPrebuilt = require('mongodb-prebuilt')
const { isArray, castArray, values, intersection, compact, merge } = require('lodash')

module.exports = class MongoPrimer {
  constructor (options) {
    this.options = merge({
      port: 27018,
      host: 'localhost',
      database: 'test',
      path: './tempb/.data',
      drop: false, // Drop collections instead of emptying them (drop() vs remove({}))
      ignore: /^(system|local)\./ // Regex of collection names to ignore
    }, options)

    this.connections = {}
  }

  getMongoURI (databaseName) {
    return 'mongodb://' + this.options.host + ':' + this.options.port + '/' + databaseName
  }
  clearCollections (collections) {
    return this.getCurrentConnection().then(db => {
      return this.getCollections().then(names => {
        collections = compact(castArray(collections))
        const filtered = collections.length ? intersection(names, castArray(collections)) : names
        return Promise.all(filtered.map(name => {
          return this.options.drop ? db.collection(name).drop() : db.collection(name).remove({})
        }))
      })
    })
  }

  clearAndLoad (fixtures) {
    const collections = Object.keys(fixtures)

    return this.clearCollections(collections).then(() => {
      return this.loadData(fixtures)
    })
  }

  startServer () {
    mkdirp.sync(this.options.path)

    const mongodHelper = new MongodbPrebuilt.MongodHelper(['--bind_ip', this.options.host, '--port', this.options.port, '--dbpath', this.options.path, '--storageEngine', 'ephemeralForTest'])

    return mongodHelper.run()
  }

  getConnection (databaseName) {
    if (this.connections[databaseName]) {
      return Promise.resolve(this.connections[databaseName])
    } else {
      return MongoClient.connect(this.getMongoURI(databaseName)).then((connection) => {
        this.connections[databaseName] = connection
        return connection
      })
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
    return this.getConnection(this.options.database)
  }

  getCollections () {
    return this.getCurrentConnection().then(db => {
      return db.listCollections().toArray().then(names => {
        return names.map(c => {
          return c.name
        }).filter(c => {
          return !c.match(this.options.ignore)
        })
      })
    })
  }

  loadData (data) {
    const collectionNames = Object.keys(data)
    return this.getCurrentConnection().then(db => {
      this.connection = db
      const promises = collectionNames.map(name => {
        const collectionData = data[name]
        const items = isArray(collectionData) ? collectionData.slice() : values(collectionData)
        return this.connection.collection(name).insert(items)
      })

      return Promise.all(promises)
    })
  }
}
