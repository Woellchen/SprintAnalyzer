var config = require('app/config'),
	client = require('redis').createClient(config.redis.port, config.redis.host);

if (config.redis.auth) {
	client.auth(config.redis.auth, function() { });
}

if (config.redis.database) {
	client.select(config.redis.database, function() { /* ... */ });
}

var redisKeySprint = 'analyzer::sprint::';

var Storage = function() {

}

Storage.prototype.storeSprint = function(sprint, data) {
	client.set(redisKeySprint + sprint, JSON.stringify(data));
}

Storage.prototype.getSprint = function (sprint, callback) {
	client.get(redisKeySprint + sprint, function(error, result) {
		callback(error, JSON.parse(result));
	});
};


module.exports = Storage;
