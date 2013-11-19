#kodb

kodb is a simple key/object interface to redis.

While redis allows the user to store and retrieve data in a variety of different
ways (strings, hashes, lists...), we often want just a way to store retrieve a
JSON-encoded JavaScript object, which is what kodb allows us to do.

To manage the asynchronous interactions with the database, kodb uses promises
(provided by the Q library), therefore every public method returns a promise.

##Install

```bash
npm install kodb
```

##Example usage

```javascript
var kodb	= require("kodb");
var Q		= require("q");
var _		= require("lodash");

var key;
var object = {
	"foo": "bar"
};

Q()
	.then(function () {
		// Connect to the database
		return kodb.connect();
	})
	.then(function () {
		// Get a unique key
		return kodb.getUniqueKey(8);
	})
	.then(function (uniqueKey) {
		key = uniqueKey;
		// Set key to object
		return kodb.set(key, object);
	})
	.then(function () {
		// Check if key exists
		return kodb.exists(key);
	})
	.then(function (exists) {
		// Get object corresponding to key
		return kodb.get(key);
	})
	.then(function (obj) {
		// Delete key
		return kodb.del(key);
	})
	.then(function () {
		// Disconnect from the database
		return kodb.disconnect();
	});
```

##API

#####[kodb.connect(port, host, options)](#connect)
#####[kodb.disconnect()](#disconnect)
#####[kodb.get(key)](#get)
#####[kodb.set(key, object)](#set)
#####[kodb.del(key)](#del)
#####[kodb.exists(key)](#exists)
#####[kodb.getUniqueKey(key)](#getUniqueKey)

- - -

###<a name="connect"></a>kodb.connect(port, host, options)

####What it does

Connects itself to the database.

####Parameters

For an explanation of its parameters, check out [the node_redis module
page](https://github.com/mranney/node_redis#rediscreateclientport-host-options).

####Promise behaviour

#####Fulfilled when

The connection to the database is established or was already established.

#####Rejected when

The connection to the database cannot be established.

####Fulfillment value

If the connection is successfully established, none.

If the connection was already established, the string "Already connected.".

- - -

###<a name="disconnect"></a>kodb.disconnect()

####What it does

Disconnects itself from the database.

####Paramters

Takes no parameters.

####Promise behaviour

#####Fulfilled when

The connection to the database is established or was already established.

#####Rejected when

Never (only when errors occur?).

####Fulfillment value

If the connection is successfully terminated, none.

If there was no connection, the string "Already disconnected.".

- - -

###<a name="get"></a>kodb.get(key)

####What it does

Gets an object from the database.

####Paramters

A string, i.e. the key to get from the database.

####Promise behaviour

#####Fulfilled when

The object is retrieved successfully from the database.

#####Rejected when

Only when errors occur.

####Fulfillment value

If the corresponding value in the database is a JSON-encoded object, that object
(already parsed).

Otherwise, undefined.

- - -

###<a name="set"></a>kodb.set(key, object)

####What it does

Sets a key/object pair into the database.

####Paramters

First parameter, a string, i.e. the key at which to save the object.

Second parameter, a plain object, i.e. the object which needs to be saved.

####Promise behaviour

#####Fulfilled when

The object is saved successfully into the database.

#####Rejected when

Only when errors occur.

####Fulfillment value

None.

- - -

###<a name="del"></a>kodb.del(key)

####What it does

Deletes a key/object pair from the database.

####Paramters

A string, i.e. the key of the pair which needs to be deleted.

####Promise behaviour

#####Fulfilled when

The pair is deleted successfully from the database.

#####Rejected when

Only when errors occur.

####Fulfillment value

None.

- - -

###<a name="exists"></a>kodb.exists(key)

####What it does

Checks if a given key already exists in the database.

####Paramters

A string, i.e. the key which needs to be checked.

####Promise behaviour

#####Fulfilled when

The database answers whether or not the given key exists.

#####Rejected when

Only when errors occur.

####Fulfillment value

True if the key exists, false if it doesn't.

- - -

###<a name="getUniqueKey"></a>kodb.getUniqueKey([length])

####What it does

Gets a unique key, i.e. a key which does not exist yet in the database.

####Paramters

Optionally, a number, which is the length of the key to get. The max length is
1024.

####Promise behaviour

#####Fulfilled when

The unique key is found.

#####Rejected when

Only when errors occur.

####Fulfillment value

The key.

- - -
