// kodb.js
// {{{ Dependencies 

	var crypto	= require("crypto");
	var _		= require("lodash");
	var Q		= require("q");
	var redis	= require("redis");

// }}}
// {{{ Extending lodash with utility methods

	_.mixin({
		isStringifiedObject: function (string) {
			try {
				var object = JSON.parse(string);
				if (!_.isPlainObject(object)) {
					throw new Error();
				}
				return true;
			} catch (e) {
				return false;
			}
		},
		getRandomString: function (length) {
			if (length > 1024) {
				length = 1024;
			}
			var buf = crypto.randomBytes(512);
			var string = buf.toString("hex");
			if (length) {
				string = string.slice(0, length);
			}
			return string;
		}
	});

// }}}
// {{{ Database methods and properties container

	var db = {};

// }}}

// {{{ exports.connect

	exports.connect = function (port, host, options) {
		if (!_.isUndefined(db.client) && db.client.connected) {
			return Q("Already connected.");
		}
		var deferred = Q.defer();

		db.client = redis.createClient(port, host, options);
		db.client.on("ready", deferred.resolve);
		db.client.on("error", function (e) {
			if (deferred.promise.isPending()) {
				return deferred.reject("Could not connect to the database.");
			}
			throw new Error("Lost connection to the database.");
		});

		db.get					= Q.nbind(db.client.get, db.client);
		db.set					= Q.nbind(db.client.set, db.client);

		db.SET_EXISTENCE_TOKEN	= "SET_EXISTENCE_TOKEN";
		db.sadd					= Q.nbind(db.client.sadd, db.client);
		db.scard				= Q.nbind(db.client.scard, db.client);
		db.sismember			= Q.nbind(db.client.sismember, db.client);
		db.smembers				= Q.nbind(db.client.smembers, db.client);
		db.srem					= Q.nbind(db.client.srem, db.client);

		db.del					= Q.nbind(db.client.del, db.client);
		db.exists				= Q.nbind(db.client.exists, db.client);
		db.type					= Q.nbind(db.client.type, db.client);

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

// {{{ exports.loadObject

	exports.loadObject = function (key) {
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
				if (!_.isStringifiedObject(value)) {
					throw new Error("Not an object.");
				}
				var object = JSON.parse(value);
				return Q(object);
			});
	};

// }}}
// {{{ exports.saveObject

	exports.saveObject = function (key, object) {
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
// {{{ exports.deleteObject

	exports.deleteObject = function (key) {
		return Q()
			.then(function () {
				if (_.isUndefined(db.client) || !db.client.connected) {
					throw new Error("You must first connect to the database.");
				}
				if (!_.isString(key)) {
					throw new Error("First argument must be a string.");
				}
				return exports.isObject(key);
			})
			.then(function (isObject) {
				if (!isObject) {
					throw new Error("Not an object.");
				}
				return db.del(key);
			});
	};

// }}}
// {{{ exports.isObject

	exports.isObject = function (key) {
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
				if (_.isStringifiedObject(value)) {
					return Q(true);
				} else {
					return Q(false);
				}
			});
	};

// }}}

// {{{ exports.createSet

	exports.createSet = function (key) {
		return Q()
			.then(function () {
				if (_.isUndefined(db.client) || !db.client.connected) {
					throw new Error("You must first connect to the database.");
				}
				if (!_.isString(key)) {
					throw new Error("First argument must be a string.");
				}
				return db.del(key);
			})
			.then(function () {
				return db.sadd(key, db.SET_EXISTENCE_TOKEN);
			});
	};

// }}}
// {{{ exports.deleteSet

	exports.deleteSet = function (key) {
		return Q()
			.then(function () {
				if (_.isUndefined(db.client) || !db.client.connected) {
					throw new Error("You must first connect to the database.");
				}
				if (!_.isString(key)) {
					throw new Error("First argument must be a string.");
				}
				return exports.isSet(key);
			})
			.then(function (isSet) {
				if (!isSet) {
					throw new Error("Not a set.");
				}
				return db.del(key);
			});
	};

// }}}
// {{{ exports.clearSet

	exports.clearSet = function (key) {
		return Q()
			.then(function () {
				if (_.isUndefined(db.client) || !db.client.connected) {
					throw new Error("You must first connect to the database.");
				}
				if (!_.isString(key)) {
					throw new Error("First argument must be a string.");
				}
				return exports.deleteSet(key);
			})
			.then(function () {
				return exports.createSet(key);
			});
	};

// }}}
// {{{ exports.isSet

	exports.isSet = function (key) {
		return Q()
			.then(function () {
				if (_.isUndefined(db.client) || !db.client.connected) {
					throw new Error("You must first connect to the database.");
				}
				if (!_.isString(key)) {
					throw new Error("First argument must be a string.");
				}
				return db.type(key);
			})
			.then(function (type) {
				if (type !== "set") {
					return Q(false);
				} else {
					return Q()
						.then(function () {
							return db.sismember(key, db.SET_EXISTENCE_TOKEN);
						})
						.then(function (isMember) {
							if (isMember === 1) {
								return Q(true);
							} else {
								return Q(false);
							}
						});
				}
			});
	};

// }}}
// {{{ exports.addToSet

	exports.addToSet = function (key, string) {
		return Q()
			.then(function () {
				if (_.isUndefined(db.client) || !db.client.connected) {
					throw new Error("You must first connect to the database.");
				}
				if (!_.isString(key)) {
					throw new Error("First argument must be a string.");
				}
				if (!_.isString(string)) {
					throw new Error("Second argument must be a string.");
				}
				return exports.isSet(key);
			})
			.then(function (isSet) {
				if (!isSet) {
					throw new Error("Not a set.");
				}
				return db.sadd(key, string);
			});
	};

// }}}
// {{{ exports.removeFromSet

	exports.removeFromSet = function (key, string) {
		return Q()
			.then(function () {
				if (_.isUndefined(db.client) || !db.client.connected) {
					throw new Error("You must first connect to the database.");
				}
				if (!_.isString(key)) {
					throw new Error("First argument must be a string.");
				}
				if (!_.isString(string)) {
					throw new Error("Second argument must be a string.");
				}
				return exports.isSet(key);
			})
			.then(function (isSet) {
				if (!isSet) {
					throw new Error("Not a set.");
				}
				return db.srem(key, string);
			});
	};

// }}}
// {{{ exports.existsInSet

	exports.existsInSet = function (key, string) {
		return Q()
			.then(function () {
				if (_.isUndefined(db.client) || !db.client.connected) {
					throw new Error("You must first connect to the database.");
				}
				if (!_.isString(key)) {
					throw new Error("First argument must be a string.");
				}
				if (!_.isString(string)) {
					throw new Error("Second argument must be a string.");
				}
				return exports.isSet(key);
			})
			.then(function (isSet) {
				if (!isSet) {
					throw new Error("Not a set.");
				}
				return db.sismember(key, string);
			})
			.then(function (isMember) {
				if (isMember === 1) {
					return Q(true);
				} else {
					return Q(false);
				}
			});
	};

// }}}
// {{{ exports.getSetMembers

	exports.getSetMembers = function (key) {
		return Q()
			.then(function () {
				if (_.isUndefined(db.client) || !db.client.connected) {
					throw new Error("You must first connect to the database.");
				}
				if (!_.isString(key)) {
					throw new Error("First argument must be a string.");
				}
				return exports.isSet(key);
			})
			.then(function (isSet) {
				if (!isSet) {
					throw new Error("Not a set.");
				}
				return db.smembers(key);
			})
			.then(function (members) {
				_.pull(members, db.SET_EXISTENCE_TOKEN);
				return Q(members);
			});
	};

// }}}
// {{{ exports.getSetCardinality

	exports.getSetCardinality = function (key) {
		return Q()
			.then(function () {
				if (_.isUndefined(db.client) || !db.client.connected) {
					throw new Error("You must first connect to the database.");
				}
				if (!_.isString(key)) {
					throw new Error("First argument must be a string.");
				}
				return exports.isSet(key);
			})
			.then(function (isSet) {
				if (!isSet) {
					throw new Error("Not a set.");
				}
				return db.scard(key);
			})
			.then(function (cardinality) {
				cardinality += -1;
				return Q(cardinality);
			});
	};

// }}}

// {{{ exports.deleteKey

	exports.deleteKey = function (key) {
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
// {{{ exports.existsKey

	exports.existsKey = function (key) {
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
				if (exists === 1) {
					return Q(true);
				} else {
					return Q(false);
				}
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
				key = _.getRandomString(length);	
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
