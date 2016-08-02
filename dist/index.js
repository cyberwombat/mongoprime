'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mongodb = require('mongodb');

var _mongodb2 = _interopRequireDefault(_mongodb);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Loader = function () {
  function Loader(options) {
    _classCallCheck(this, Loader);

    this.options = _lodash2.default.merge({
      drop: false, // Drop collections instead of emptying them (drop() vs remove({}))
      ignore: /^(system|local)\./ // Regex of collection names to ignore
    }, options);
  }

  _createClass(Loader, [{
    key: 'clearCollections',
    value: function clearCollections(collections) {
      var _this = this;

      return this.getConnection().then(function (db) {
        return _this.getCollections().then(function (names) {
          collections = _lodash2.default.compact(_lodash2.default.castArray(collections));
          var filtered = collections.length ? _lodash2.default.intersection(names, _lodash2.default.castArray(collections)) : names;
          return Promise.all(filtered.map(function (name) {
            return _this.options.drop ? db.collection(name).drop() : db.collection(name).remove({});
          }));
        });
      });
    }
  }, {
    key: 'clearAndLoad',
    value: function clearAndLoad(fixtures) {
      var _this2 = this;

      var collections = Object.keys(fixtures);

      return this.clearCollections(collections).then(function () {
        return _this2.loadData(fixtures);
      });
    }
  }, {
    key: 'closeConnection',
    value: function closeConnection() {
      if (!this.connection) throw new Error('No connection found!');
      return this.connection.close();
    }
  }, {
    key: 'getConnection',
    value: function getConnection() {
      if (!this.client) this.client = _mongodb2.default.MongoClient.connect(this.options.uri);
      return this.client;
    }
  }, {
    key: 'getCollections',
    value: function getCollections() {
      var _this3 = this;

      return this.getConnection().then(function (db) {
        return db.listCollections().toArray().then(function (names) {
          return names.map(function (c) {
            return c.name;
          }).filter(function (c) {
            return !c.match(_this3.options.ignore);
          });
        });
      });
    }
  }, {
    key: 'loadData',
    value: function loadData(data) {
      var _this4 = this;

      var collectionNames = Object.keys(data);
      return this.getConnection().then(function (db) {
        _this4.connection = db;
        var promises = collectionNames.map(function (name) {
          var collectionData = data[name];
          var items = _lodash2.default.isArray(collectionData) ? collectionData.slice() : _lodash2.default.values(collectionData);
          return _this4.connection.collection(name).insert(items);
        });

        return Promise.all(promises);
      });
    }
  }]);

  return Loader;
}();

exports.default = Loader;