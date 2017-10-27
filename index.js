const { MongoClient, ObjectId } = require('mongodb')
const net = require('net')
const debug = require('debug')('mongoprime')
const uniqueTempDir = require('unique-temp-dir')
const MongodbPrebuilt = require('mongodb-prebuilt')
const process = require('process')
const getPort = require('get-port')
const MongoWireProtocol = require('mongo-wire-protocol')

let options = {
  fixtures: {}, // Fixture collection
  host: '127.0.0.1', // Proxy host
  port: 27018, // Proxy port
  ignore: ['system', 'admin', 'local'], // Collections to ignore
  path: null, // Path for mongo metadata - defaults to randomly generated systm tmp dir
  mongo: null // Mongo port - randomly generated
}

let initialized = false
let connections = {}
let primed = []

const startProxy = async () => {
  const server = net.createServer()

  server.on('connection', (socket) => {
    debug('New connection received')
    var request = new MongoWireProtocol()
    socket.on('data', async (chunk) => {
      if (request.finished) {
        request = new MongoWireProtocol()
      }
      request.parse(chunk)
      if (!request.finished) {

      }
      const database = request.fullCollectionName.replace('.$cmd', '')

      await primeDatabase(database)

      forwardRequest(socket, chunk, database)
    })

    socket.on('error', error => {
      console.error(error)
    })
    socket.on('close', () => {
      debug('Connection closed')
    })
  })

  server.on('listening', () => {
    debug('Server started')
  })

  server.listen({port: options.port, host: options.host})
}

const forwardRequest = (socket, chunk, database) => {
  const serviceSocket = new net.Socket()
  serviceSocket.connect(options.mongo, options.host, function () {
    debug(`Forwarding data to ${database}`)
    serviceSocket.write(chunk)
  })
  serviceSocket.on('end', function () {

  })
  serviceSocket.on('data', function (data) {
    debug(`Receiving data from ${database}`)

    socket.write(data)
    // socket.end()
  })
}

const primeDatabase = async (database) => {
  if (!!~options.ignore.indexOf(database) || !!~primed.indexOf(database)) return

  primed.push(database)
  debug(`Priming ${database}`)
  await clearCollections(database)

  await loadFixtures(database)
}

const initProxy = async (params) => {
  if (initialized) return

  options = Object.assign(options, params)

  options.mongo = await getPort()
  options.path = options.path || uniqueTempDir({ create: true })

  await startServer()
  await startProxy()

  process.env.MONGO_PRIMER_DB_PORT = options.port
  process.env.MONGO_PRIMER_DB_HOST = options.host

  initialized = true
}

const getUri = (databaseName) => {
  return 'mongodb://' + options.host + ':' + options.mongo + '/' + databaseName
}
const clearCollections = async (database) => {
  const db = await getConnection(database)

  const names = await listCollections(database)

  const filtered = Object.keys(options.fixtures).filter(c => ~names.indexOf(c))

  return Promise.all(filtered.map(name => {
    return db.collection(name).drop()
  }))
}

const startServer = async () => {
  const mongodHelper = new MongodbPrebuilt.MongodHelper(['--bind_ip', options.host, '--port', options.mongo, '--dbpath', options.path, '--storageEngine', 'ephemeralForTest'])

  await mongodHelper.run()
}

const getConnection = async (database) => {
  if (connections[database]) {
    debug(`Reusing ${database} connection`)
    return Promise.resolve(connections[database])
  } else {
    const url = getUri(database)

    connections[database] = await MongoClient.connect(url)

    return connections[database]
  }
}

const stopServer = async () => {
  Object.keys(connections).map(databaseName => {
    connections[databaseName].close()
  })

  return new MongodbPrebuilt.MongoBins('mongo', ['--port', options.mongo, '--eval', "db.getSiblingDB('admin').shutdownServer()"]).run()
}

const closeAll = async (database) => {
  const db = await getConnection(database)
  db.stop()
}

const listCollections = async (database) => {
  const db = await getConnection(database)

  const names = await db.listCollections().toArray()
  return names.map(c => {
    return c.name
  }).filter(c => {
    return !c.match(options.ignore)
  })
}

const loadFixtures = async (database) => {
  const db = await getConnection(database)

  const promises = Object.keys(options.fixtures).map(name => {
    const items = options.fixtures[name]
    return db.collection(name).insert(items)
  })

  return Promise.all(promises)
}

exports.initProxy = initProxy
exports.stopServer = stopServer
exports.closeAll = closeAll
exports.ObjectId = ObjectId
