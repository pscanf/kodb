// kodb.js
// {{{ Dependencies 

	var crypto	= require("crypto");
	var _		= require("lodash");
	var Q		= require("q");
	var redis	= require("redis");

// }}}
// {{{ Utils

	var utils = {};
	utils.isStringifiedObject = function (string) {
		try {
			var object = JSON.parse(string);
			if (!_.isPlainObject(object)) {
				throw new Error();
			}
			return true;
		} catch (e) {
			return false;
		}
	};
	utils.getRandomString = function (length) {
		if (length > 1024) {
			length = 1024;
		}
		var buf = crypto.randomBytes(512);
		var string = buf.toString("hex");
		if (length) {
			string = string.slice(0, length);
		}
		return string;
	};

// }}}
// {{{ Functions container

	var db = {};

// }}}
// {{{ exports.connect

	exports.connect = function (port, host, options) {
		if (!_.isUndefined(db.client) && db.client.connected) {
			return Q("Already connected.");
		}
		var deferred = Q.defer();
		db.client	= redis.createClient(port, host, options);
		db.exists	= Q.nbind(db.client.exists, db.client);
		db.get		= Q.nbind(db.client.get, db.client);
		db.set		= Q.nbind(db.client.set, db.client);
		db.del		= Q.nbind(db.client.del, db.client);
		db.client.on("ready", deferred.resolve);
		db.client.on("error", function (e) {
			if (deferred.promise.isPending()) {
				return deferred.reject("Could not connect to the database.");
			}
			throw new Error("Lost connection to the database.");
		});
		return deferred.promise;
	};

// }}}
// {{{ exports.disconnect

	exports.disconnect = function () {
		if (_.isUndefined(db.client) || !db.client.connected) {
			return Q("Already disconnected.");
		}
		var deferred = Q.defer();
		db.client.quit();
		db.client.on("end", deferred.resolve);
		return deferred.promise;
	};

// }}}
// {{{ exports.get

	exports.get = function (key) {
		return Q()
			.then(function () {
				if (_.isUndefined(db.client) || !db.client.connected) {
					throw new Error("You must first connect to the database.");
				}
				if (!_.isString(key)) {
					throw new Error("First argument must be a string.");
				}
				return db.get(key);
			})
			.then(function (value) {
				if (!utils.isStringifiedObject(value)) {
					return Q(undefined);
				}
				var object = JSON.parse(value);
				return Q(object);
			});
	};

// }}}
// {{{ exports.set

	exports.set = function (key, object) {
		return Q()
			.then(function () {
				if (_.isUndefined(db.client) || !db.client.connected) {
					throw new Error("You must first connect to the database.");
				}
				if (!_.isString(key)) {
					throw new Error("First argument must be a string.");
				}
				if (!_.isPlainObject(object)) {
					throw new Error("Second argument must be a plain object.");
				}
				var value = JSON.stringify(object);
				return db.set(key, value);
			});
	};

// }}}
// {{{ exports.del

	exports.del = function (key) {
		return Q()
			.then(function () {
				if (_.isUndefined(db.client) || !db.client.connected) {
					throw new Error("You must first connect to the database.");
				}
				if (!_.isString(key)) {
					throw new Error("First argument must be a string.");
				}
				return db.del(key);
			});
	};

// }}}
// {{{ exports.exists

	exports.exists = function (key) {
		return Q()
			.then(function () {
				if (_.isUndefined(db.client) || !db.client.connected) {
					throw new Error("You must first connect to the database.");
				}
				if (!_.isString(key)) {
					throw new Error("First argument must be a string.");
				}
				return db.exists(key);
			})
			.then(function (exists) {
				var ret = (exists === 0 ? false : true);
				return Q(ret);
			});
	};

// }}}
// {{{ exports.getUniqueKey

	exports.getUniqueKey = function (length) {
		var key;
		return Q()
			.then(function () {
				if (_.isUndefined(db.client) || !db.client.connected) {
					throw new Error("You must first connect to the database.");
				}
				key = utils.getRandomString(length);	
				return db.exists(key);
			})
			.then(function (exists) {
				if (exists) {
					return exports.getUniqueKey(length);
				} else {
					return Q(key);
				}
			});
	};
// }}}
