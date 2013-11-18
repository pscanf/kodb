// kodbSpec.js
// {{{ Dependencies

	var crypto	= require("crypto");
	var _		= require("lodash");
	var must	= require("must");
	var Q		= require("q");
	var redis	= require("redis");
	var rewire	= require("rewire");

// }}}
// {{{ Module

	var db		= rewire("../src/kodb.js");

// }}}
// {{{ The utils private object

	// Since these two functions are trivial, I'm going to
	// assume their correctness. I just need to know thy are
	// defined. For now.
	describe("The utils private object", function () {
		var utils = db.__get__("utils");
		it("must have a isStringifiedObject method", function () {
			utils.must.have.property("isStringifiedObject");
			utils.isStringifiedObject.must.be.a.function();
		});
		it("must have a getRandomString method", function () {
			utils.must.have.property("getRandomString");
			utils.getRandomString.must.be.a.function();
		});
	});

// }}}
// {{{ The kodb module

	describe("The kodb module", function () {
		it("must export a connect method", function () {
			db.must.have.property("connect");
			db.connect.must.be.a.function();
		});
		it("must export a disconnect method", function () {
			db.must.have.property("disconnect");
			db.disconnect.must.be.a.function();
		});
		it("must export a get method", function () {
			db.must.have.property("get");
			db.get.must.be.a.function();
		});
		it("must export a set method", function () {
			db.must.have.property("set");
			db.set.must.be.a.function();
		});
		it("must export a del method", function () {
			db.must.have.property("del");
			db.del.must.be.a.function();
		});
		it("must export a exists method", function () {
			db.must.have.property("exists");
			db.exists.must.be.a.function();
		});
		it("must export a getUniqueKey method", function () {
			db.must.have.property("getUniqueKey");
			db.getUniqueKey.must.be.a.function();
		});
	});

// }}}
// {{{ All of the above methods

	describe("All of the above methods", function () {
		it("must return a promise", function (done) {
			Q()
				.then(function () {
					var ret = db.connect();
					Q.isPromise(ret).must.be.true();
					return ret;
				})
				.then(function () {
					var ret = db.set("someKey", {"someProperty": "someValue"});
					Q.isPromise(ret).must.be.true();
					return ret;
				})
				.then(function () {
					var ret = db.get("someKey");
					Q.isPromise(ret).must.be.true();
					return ret;
				})
				.then(function () {
					var ret = db.del("someKey");
					Q.isPromise(ret).must.be.true();
					return ret;
				})
				.then(function () {
					var ret = db.exists("someKey");
					Q.isPromise(ret).must.be.true();
					return ret;
				})
				.then(function () {
					var ret = db.getUniqueKey();
					Q.isPromise(ret).must.be.true();
					return ret;
				})
				.then(function () {
					var ret = db.disconnect();
					Q.isPromise(ret).must.be.true();
					return ret;
				})
				.done(function () {
					done();
				});
		});
	});

// }}}
// {{{ The connect method

	describe("The connect method", function () {
		it("must connect the client to the database", function (done) {
			Q()
				.then(function () {
					return db.connect();
				})
				.then(function () {
					db.__get__("db").client.connected.must.be.true();
					done();
				})
				.done();
		});
		it("must return \"Already connected.\" if it's already connected.", function (done) {
			Q()
				.then(function () {
					db.__get__("db").client.connected.must.be.true();
					return db.connect();
				})
				.then(function (ret) {
					ret.must.equal("Already connected.");
					done();
				})
				.done();
		});
	});

// }}}
// {{{ The disconnect method

	describe("The disconnect method", function () {
		it("must disconnect the client from the database", function (done) {
			Q()
				.then(function () {
					return db.disconnect();
				})
				.then(function () {
					db.__get__("db").client.connected.must.be.false();
					done();
				})
				.done();
		});
		it("must return \"Already disconnected.\" if it's already disconnected.", function (done) {
			Q()
				.then(function () {
					db.__get__("db").client.connected.must.not.be.true();
					return db.disconnect();
				})
				.then(function (ret) {
					ret.must.equal("Already disconnected.");
					done();
				})
				.done();
		});
	});

// }}}
// {{{ The get, set, del, exists, and getUniqueKey methods

	describe("The get method", function () {
		it("must throw if there is no connection to the database", function (done) {
			Q()
				.then(function () {
					return db.get("someKey");
				})
				.catch(function (e) {
					e.message.must.equal("You must first connect to the database.");
					done();
				})
				.done();
		});
	});

	describe("The set method", function () {
		it("must throw if there is no connection to the database", function (done) {
			Q()
				.then(function () {
					return db.set("someKey", {"someProperty": "someValue"});
				})
				.catch(function (e) {
					e.message.must.equal("You must first connect to the database.");
					done();
				})
				.done();
		});
	});

	describe("The del method", function () {
		it("must throw if there is no connection to the database", function (done) {
			Q()
				.then(function () {
					return db.del("someKey");
				})
				.catch(function (e) {
					e.message.must.equal("You must first connect to the database.");
					done();
				})
				.done();
		});
	});

	describe("The exists method", function () {
		it("must throw if there is no connection to the database", function (done) {
			Q()
				.then(function () {
					return db.exists("someKey");
				})
				.catch(function (e) {
					e.message.must.equal("You must first connect to the database.");
					done();
				})
				.done();
		});
	});

	describe("The getUniqueKey method", function () {
		it("must throw if there is no connection to the database", function (done) {
			Q()
				.then(function () {
					return db.getUniqueKey();
				})
				.catch(function (e) {
					e.message.must.equal("You must first connect to the database.");
					done();
				})
				.done();
		});
	});

// }}}
// {{{ Upon connection, the get method

	describe("Upon connection, the get method", function () {

		var rdb = {};

		var object = {
			"testProperty": "testValue"
		};

		var JSONStringKey		= "JSONStringKey";
		var JSONStringValue		= JSON.stringify(object);

		var nonJSONStringKey	= "nonJSONStringKey";
		var nonJSONStringValue	= "nonJSONStringValue";

		var nonExistingKey		= "nonExistingKey";

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
					return rdb.del(nonExistingKey);
				})
				.then(function () {
					return db.connect();
				})
				.then(function () {
					done();
				});
		});

		it("must throw if its first argument is not a string", function (done) {
			var message = "";
			Q()
				.then(function () {
					return db.get({});
				})
				.catch(function (e) {
					message = e.message;
					message.must.equal("First argument must be a string.");
					done();
				})
				.done();
		});

		it("must return an object when in the db there is a stringified object", function (done) {
			Q()
				.then(function () {
					return db.get(JSONStringKey);
				})
				.then(function (obj) {
					_.isEqual(obj, object).must.be.true();
					done();
				})
				.done();
		});

		it("must return undefined when in the db there is something other than a stringified object", function (done) {
			Q()
				.then(function () {
					return db.get(nonJSONStringKey);
				})
				.then(function (obj) {
					(_.isUndefined(obj)).must.be.true();
					done();
				})
				.done();
		});

		it("must return undefined when in the db there is nothing", function (done) {
			Q()
				.then(function () {
					return db.get(nonExistingKey);
				})
				.then(function (obj) {
					(_.isUndefined(obj)).must.be.true();
					done();
				})
				.done();
		});

		after(function (done) {
			Q()
				.then(function () {
					return rdb.del(JSONStringKey);
				})
				.then(function () {
					return rdb.del(nonJSONStringKey);
				})
				.then(function () {
					var deferred = Q.defer();
					rdb.client.quit();
					rdb.client.on("end", deferred.resolve);
					return deferred.promise;
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
// {{{ Upon connection, the set method

	describe("Upon connection, the set method", function (done) {

		var rdb = {};
		var key = "setTestKey";
		var object = {
			"testProperty": "testValue"
		};

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
					return rdb.del(key);
				})
				.then(function () {
					return db.connect();
				})
				.then(function () {
					done();
				});
		});

		it("must throw if its first argument is not a string", function (done) {
			var message;
			Q()
				.then(function () {
					return db.set({});
				})
				.catch(function (e) {
					message = e.message;
					message.must.equal("First argument must be a string.");
					done();
				})
				.done();
		});

		it("must throw if its second argument is not a plain object", function (done) {
			var message;
			Q()
				.then(function () {
					return db.set("", "");
				})
				.catch(function (e) {
					message = e.message;
					message.must.equal("Second argument must be a plain object.");
					done();
				})
				.done();
		});

		it("must set key/value to first argument/JSON-encoded second argument", function (done) {
			Q()
				.then(function () {
					return db.set(key, object);
				})
				.then(function () {
					return rdb.get(key);
				})
				.then(function (value) {
					value.must.equal(JSON.stringify(object));
					done();
				})
				.done();
		});

		after(function (done) {
			Q()
				.then(function () {
					return rdb.del(key);
				})
				.then(function () {
					var deferred = Q.defer();
					rdb.client.quit();
					rdb.client.on("end", deferred.resolve);
					return deferred.promise;
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
// {{{ Upon connection, the del method

	describe("Upon connection, the del method", function (done) {

		var rdb = {};
		var key = "delTestKey";
		var object = {
			"testProperty": "testValue"
		};

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
					return db.set(key, object);
				})
				.then(function () {
					done();
				});
		});

		it("must throw if its first argument is not a string", function (done) {
			var message;
			Q()
				.then(function () {
					return db.del({});
				})
				.catch(function (e) {
					message = e.message;
					message.must.equal("First argument must be a string.");
					done();
				})
				.done();
		});

		it("must delete the key from the database", function (done) {
			Q()
				.then(function () {
					return rdb.exists(key);
				})
				.then(function (exists) {
					exists.must.equal(1);
					return db.del(key);
				})
				.then(function () {
					return rdb.exists(key);
				})
				.then(function (exists) {
					exists.must.equal(0);
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
					return db.disconnect();
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
