import mongo from 'mongodb'
import _ from 'lodash'

const env = process.env.NODE_ENV || 'development'

export default class Loader {
  constructor(options) {
    this.options = _.merge({
      drop: false, // Drop collections instead of emptying them (drop() vs remove({}))
      ignore: /^(system|local)\./ // Regex of collection names to ignore
    }, options)
  }

  clearCollections(collections) {
    if(env === 'production') return Promise.reject(new Error('Production mode on - cannot clear database'))
    return this.getConnection().then((db) => {
      return this.getCollections().then((names) => {
        collections = _.compact(_.castArray(collections))
        const filtered = collections.length ? _.intersection(names, _.castArray(collections)) : names
        return Promise.all(filtered.map((name) => {
          return this.options.drop ? db.collection(name).drop() : db.collection(name).remove({})
        }))
      })
    })
  }

  clearAndLoad(fixtures) {
    const collections = Object.keys(fixtures)

    return this.clearCollections(collections).then(() => {
      return this.loadData(fixtures)
    })
  }

  closeConnection() {
    if (!this.connection) throw new Error('No connection found!')
    return this.connection.close()
  }

  getConnection() {
    if (!this.client)
      this.client = mongo.MongoClient.connect(this.options.uri)
    return this.client
  }

  getCollections() {
    return this.getConnection().then((db) => {
      return db.listCollections().toArray().then((names) => {
        return names.map((c) => {
          return c.name
        }).filter((c) => {
          return !c.match(this.options.ignore)
        })
      })
    })
  }

  loadData(data) {
    const collectionNames = Object.keys(data)
    return this.getConnection().then((db) => {
      this.connection = db
      const promises = collectionNames.map((name) => {
        const collectionData = data[name]
        const items = _.isArray(collectionData) ? collectionData.slice() : _.values(collectionData)
        return this.connection.collection(name).insert(items)
      })

      return Promise.all(promises)
    })
  }
}
