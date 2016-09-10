import { expect } from 'chai'
import Loader from '../src/index'
import fixtures from './fixtures'


let loader

before(() => {
  loader = new Loader({ uri: 'mongodb://127.0.0.1/mongoloader', drop: true })
})

after(() => {
  return loader.closeConnection()
})

beforeEach(() => {
  return loader.clearCollections()
})

it('should load a single fixture', () => {
  return loader.clearAndLoad({ kittens: fixtures.kittens }).then(() => {
    return loader.getConnection().then(db => {
      return db.collection('kittens').find().toArray().then(kittens => {
        expect(kittens).to.have.length(4)
      }).then(() =>  {
         return loader.getCollections().then(names => {
          expect(names).to.eql(['kittens'])
        })
      })
    })
  })
})

it('should load multiple fixture', () => {
  return loader.clearAndLoad(fixtures).then(() =>  {
    return loader.getConnection().then(db => {
      return db.collection('kittens').find().toArray().then(kittens => {
        expect(kittens).to.have.length(4)
      }).then(() =>  {
         return loader.getCollections().then(names => {
           expect(names).to.eql(['kittens', 'puppies'])
        })
      })
    })
  })
})
