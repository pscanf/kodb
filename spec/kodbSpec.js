// kodbSpec.js

// Dependencies
	var crypto	= require("crypto");
	var _		= require("lodash");
	var must	= require("must");
	var Q		= require("q");
	var redis	= require("redis");
	var rewire	= require("rewire");

// Module to test
	var kodb	= rewire("../src/kodb.js");



// Setup
	var v = {};
	v.JSONStringKey			= "JSONStringKey";
	v.object				= {"testProperty": "testValue"};
	v.JSONStringValue		= JSON.stringify(v.object);
	v.nonJSONStringKey		= "nonJSONStringKey";
	v.nonJSONStringValue	= "nonJSONStringValue";
	var REDIS = {};
	before(function (done) {
		Q()
			.then(function () {
				REDIS.client	= redis.createClient();
				REDIS.get		= Q.nbind(REDIS.client.get, REDIS.client);
				REDIS.set		= Q.nbind(REDIS.client.set, REDIS.client);
				REDIS.del		= Q.nbind(REDIS.client.del, REDIS.client);
				var deferred = Q.defer();
				REDIS.client.on("ready", deferred.resolve);
				return deferred.promise;
			})
			.then(function () {
				return Q.all([
					REDIS.set(v.JSONStringKey, v.JSONStringValue),
					REDIS.set(v.nonJSONStringKey, v.nonJSONStringValue)
				]);
			})
			.done(function () {
				done();
			});
	});
	var f = {};
	f.connect = function (done) {
		kodb.connect().done(done);
	};
	f.disconnect = function (done) {
		kodb.disconnect().done(done);
	};
	f.passError = function (error) {
		return Q(error.message);
	};



// TEST 0 - The _ private object
	// Since these two functions are trivial, I'm going to
	// assume their correctness. I just need to know thy are
	// defined. For now.
	describe("The _ private object", function () {
		var lodash = kodb.__get__("_");
		it("must have a isStringifiedObject method", function () {
			lodash.must.have.property("isStringifiedObject");
			lodash.isStringifiedObject.must.be.a.function();
		});
		it("must have a getRandomString method", function () {
			lodash.must.have.property("getRandomString");
			lodash.getRandomString.must.be.a.function();
		});
	});



// TEST 1 - The kodb methods
	v.methods = [
		"connect",			"disconnect",		"loadObject",
		"saveObject",		"deleteObject",		"isObject",
		"createSet",		"deleteSet",		"clearSet",
		"isSet",			"addToSet",			"removeFromSet",
		"existsInSet",		"getSetMembers",	"getSetCardinality",
		"deleteKey",		"existsKey",		"getUniqueKey"
	];
	describe("The kodb methods", function () {
		it("must be the ones here defined (see test code)", function () {
			v.methods.forEach(function (method) {
				kodb.must.have.property(method);
				kodb[method].must.be.a.function();
			});
		});
	});
	describe("The kodb methods, except for connect and disconnect", function () {
		var methods = _.without(v.methods, "connect", "disconnect");
		it("must return promises", function () {
			methods.forEach(function (method) {
				var promise = kodb[method]();
				Q.isPromise(promise).must.be.true();
			});
		});
		it("must throw if there is no connection to the database", function (done) {
			var promises = [];
			methods.forEach(function (method, index) {
				promises[index] = kodb[method]();
			});
			Q.allSettled(promises)
				.then(function (results) {
					results.forEach(function (result) {
						result.state.must.equal("rejected");
						result.reason.message.must.equal("You must first connect to the database.");
					});
				})
				.done(function () {
					done();
				});
		});
	});
	describe("The kodb methods connect and disconnect", function () {
		var methods = ["connect", "disconnect"];
		it("must return promises", function () {
			methods.forEach(function (method) {
				var promise = kodb[method]();
				Q.isPromise(promise).must.be.true();
			});
		});
	});

/*
// {{{ The connect method

	describe("The connect method", function () {
		it("must connect the client to the database", function (done) {
			Q()
				.then(function () {
					return kodb.connect();
				})
				.then(function () {
					kodb.__get__("db").client.connected.must.be.true();
				})
				.done(function () {
					done();
				});
		});
		it("must return \"Already connected.\" if it's already connected.", function (done) {
			Q()
				.then(function () {
					kodb.__get__("db").client.connected.must.be.true();
					return kodb.connect();
				})
				.then(function (ret) {
					ret.must.equal("Already connected.");
				})
				.done(function () {
					done();
				});
		});
	});

// }}}
// {{{ The disconnect method

	describe("The disconnect method", function () {
		it("must disconnect the client from the database", function (done) {
			Q()
				.then(function () {
					return kodb.disconnect();
				})
				.then(function () {
					kodb.__get__("db").client.connected.must.be.false();
				})
				.done(function () {
					done();
				});
		});
		it("must return \"Already disconnected.\" if it's already disconnected.", function (done) {
			Q()
				.then(function () {
					kodb.__get__("db").client.connected.must.not.be.true();
					return kodb.disconnect();
				})
				.then(function (ret) {
					ret.must.equal("Already disconnected.");
				})
				.done(function () {
					done();
				});
		});
	});

// }}}
// {{{ Upon connection, the loadObject method

	describe("Upon connection, the loadObject method", function () {

		before(connect);

		it("must throw if its first argument is not a string", function (done) {
			kodb.loadObject({})
				.catch(passError)
				.done(function (message) {
					message.must.equal("First argument must be a string.");
					done();
				});
		});

		it("must throw if in the db there is not a stringified object", function (done) {
			kodb.loadObject(nonJSONStringKey)
				.catch(passError)
				.done(function (message) {
					message.must.equal("Not an object.");
					done();
				});
		});

		it("must return the stored object when in the db there is a stringified object", function (done) {
			kodb.loadObject(JSONStringKey)
				.done(function (obj) {
					_.isEqual(obj, object).must.be.true();
					done();
				});
		});

		after(disconnect);

	});

// }}}
// {{{ Upon connection, the saveObject method

	describe("Upon connection, the saveObject method", function (done) {

		var rdb = {};

		var object = {
			"testProperty": "testValue"
		};

		var JSONStringKey		= "JSONStringKey";
		var JSONStringValue		= JSON.stringify(object);

		before(function (done) {
			Q()
				.then(function () {
					var deferred = Q.defer();
					rdb.client	= redis.createClient();
					rdb.get	= Q.nbind(rdb.client.get, rdb.client);
					rdb.del	= Q.nbind(rdb.client.del, rdb.client);
					rdb.client.on("ready", deferred.resolve);
					return deferred.promise;
				})
				.then(function () {
					return rdb.del(JSONStringKey);
				})
				.then(function () {
					return kodb.connect();
				})
				.done(function () {
					done();
				});
		});

		it("must throw if its first argument is not a string", function (done) {
			Q()
				.then(function () {
					return kodb.saveObject({});
				})
				.catch(function (e) {
					e.message.must.equal("First argument must be a string.");
				})
				.done(function () {
					done();
				});
		});

		it("must throw if its second argument is not a plain object", function (done) {
			Q()
				.then(function () {
					return kodb.saveObject("", "");
				})
				.catch(function (e) {
					e.message.must.equal("Second argument must be a plain object.");
				})
				.done(function () {
					done();
				});
		});

		it("must set key/value to first argument/JSON-encoded second argument", function (done) {
			Q()
				.then(function () {
					return kodb.saveObject(JSONStringKey, object);
				})
				.then(function () {
					return rdb.get(JSONStringKey);
				})
				.then(function (value) {
					value.must.equal(JSONStringValue);
				})
				.done(function () {
					done();
				});
		});

		after(function (done) {
			Q()
				.then(function () {
					return rdb.del(JSONStringKey);
				})
				.then(function () {
					var deferred = Q.defer();
					rdb.client.quit();
					rdb.client.on("end", deferred.resolve);
					return deferred.promise;
				})
				.then(function () {
					return kodb.disconnect();
				})
				.done(function () {
					done();
				});
		});

	});

// }}}
// {{{ Upon connection, the deleteObject method

	describe("Upon connection, the deleteObject method", function (done) {

		var rdb = {};

		var object = {
			"testProperty": "testValue"
		};

		var JSONStringKey		= "JSONStringKey";
		var JSONStringValue		= JSON.stringify(object);

		var nonJSONStringKey	= "nonJSONStringKey";
		var nonJSONStringValue	= "nonJSONStringValue";

		before(function (done) {
			Q()
				.then(function () {
					var deferred = Q.defer();
					rdb.client	= redis.createClient();
					rdb.set	= Q.nbind(rdb.client.set, rdb.client);
					rdb.del	= Q.nbind(rdb.client.del, rdb.client);
					rdb.client.on("ready", deferred.resolve);
					return deferred.promise;
				})
				.then(function () {
					return rdb.set(JSONStringKey, JSONStringValue);
				})
				.then(function () {
					return rdb.set(nonJSONStringKey, nonJSONStringValue);
				})
				.then(function () {
					return kodb.connect();
				})
				.done(function () {
					done();
				});
		});

		it("must throw if its first argument is not a string", function (done) {
			Q()
				.then(function () {
					return db.deleteObject({});
				})
				.catch(function (e) {
					e.message.must.equal("First argument must be a string.");
				})
				.done(function () {
					done();
				});
		});

		it("must throw if in the db there is not a stringified object", function (done) {
			Q()
				.then(function () {
					return kodb.deleteObject(nonJSONStringKey);
				})
				.catch(function (e) {
					e.message.must.equal("Not an object.");
				})
				.done(function () {
					done();
				});
		});

		it("must delete the key from the database", function (done) {
			Q()
				.then(function () {
					return rdb.exists(JSONStringKey);
				})
				.then(function (exists) {
					exists.must.equal(1);
					return kodb.deleteObject(JSONStringKey);
				})
				.then(function () {
					return rdb.exists(JSONStringKey);
				})
				.then(function (exists) {
					exists.must.equal(0);
				})
				.done(function () {
					done();
				});
		});

		after(function (done) {
			Q()
				.then(function () {
					var deferred = Q.defer();
					rdb.client.quit();
					rdb.client.on("end", deferred.resolve);
					return deferred.promise;
				})
				.then(function () {
					return kodb.disconnect();
				})
				.then(function () {
					done();
				});
		});

	});

// }}}
// {{{ Upon connection, the exists method

	describe("Upon connection, the exists method", function (done) {

		var rdb = {};
		var existingKey = "existingKey";
		var existingKeyObject = {
			"testProperty": "testValue"
		};
		var nonExistingKey = "nonExistingKey";

		before(function (done) {
			Q()
				.then(function () {
					var deferred = Q.defer();
					rdb.client	= redis.createClient();
					rdb.exists	= Q.nbind(rdb.client.exists, rdb.client);
					rdb.client.on("ready", deferred.resolve);
					return deferred.promise;
				})
				.then(function () {
					return db.connect();
				})
				.then(function () {
					return db.set(existingKey, existingKeyObject);
				})
				.then(function () {
					return db.del(nonExistingKey);
				})
				.then(function () {
					done();
				});
		});

		it("must throw if its first argument is not a string", function (done) {
			var message;
			Q()
				.then(function () {
					return db.exists({});
				})
				.catch(function (e) {
					message = e.message;
					message.must.equal("First argument must be a string.");
					done();
				})
				.done();
		});

		it("must return true if the key exists in the database", function (done) {
			Q()
				.then(function () {
					return rdb.exists(existingKey);
				})
				.then(function (exists) {
					exists.must.equal(1);
					return db.exists(existingKey);
				})
				.then(function (exists) {
					exists.must.equal(true);
					done();
				})
				.done();
		});

		it("must return false if the key does not exist in the database", function (done) {
			Q()
				.then(function () {
					return rdb.exists(nonExistingKey);
				})
				.then(function (exists) {
					exists.must.equal(0);
					return db.exists(nonExistingKey);
				})
				.then(function (exists) {
					exists.must.equal(false);
					done();
				})
				.done();
		});

		after(function (done) {
			Q()
				.then(function () {
					var deferred = Q.defer();
					rdb.client.quit();
					rdb.client.on("end", deferred.resolve);
					return deferred.promise;
				})
				.then(function () {
					return db.del(existingKey);
				})
				.then(function () {
					return db.disconnect();
				})
				.then(function () {
					done();
				});
		});

	});

// }}}
// {{{ Upon connection, the getUniqueKey method

	describe("Upon connection, the getUniqueKey method", function (done) {

		before(function (done) {
			Q()
				.then(function () {
					return db.connect();
				})
				.then(function () {
					done();
				});
		});

		it("must return a non-existing key", function (done) {
			Q()
				.then(function () {
					return db.getUniqueKey();
				})
				.then(function (key) {
					return db.exists(key);
				})
				.then(function (exists) {
					exists.must.equal(false);
					done();
				});
		});

		after(function (done) {
			Q()
				.then(function () {
					return db.disconnect();
				})
				.then(function () {
					done();
				});
		});

	});

// }}}
*/

// Tear down

	after(function (done) {
		Q()
			.then(function () {
				var deferred = Q.defer();
				REDIS.client.quit();
				REDIS.client.on("end", deferred.resolve);
				return deferred.promise;
			})
			.done(done);
	});
