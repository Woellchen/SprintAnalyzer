var config = require('app/config/config'),
	client = require('redis').createClient(config.redis.port, config.redis.host);

if (config.redis.auth) {
	client.auth(config.redis.auth, function() { });
}

if (config.redis.database) {
	client.select(config.redis.database, function() { /* ... */ });
}

var redisKeySprint = 'analyzer::sprint::',
	redisKeyRapidView = 'analyzer::rapidView::';

function Storage() {

}

Storage.prototype.storeSprint = function(sprint, data) {
	client.set(redisKeySprint + sprint, JSON.stringify(data));
};

Storage.prototype.getSprint = function (sprint, callback) {
	client.get(redisKeySprint + sprint, function(error, result) {
		callback(error, JSON.parse(result));
	});
};

Storage.prototype.storeRapidViewId = function(projectId, rapidViewId) {
	client.set(redisKeyRapidView + projectId, rapidViewId);
};

Storage.prototype.getRapidViewId = function (projectId, callback) {
	client.get(redisKeyRapidView + projectId, function(error, result) {
		callback(error, result);
	});
};

module.exports = Storage;
