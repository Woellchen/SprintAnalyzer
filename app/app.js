var config = require('app/config.js');
var Hapi = require('hapi');

var server = new Hapi.Server(config.app_host, config.app_port);

server.route({
	'path': '/{path*}',
	'method': 'GET',
	'handler': {
		'directory': {
			'path': __dirname + '/../www'
		}
	}
});
server.route({
	'path': '/projects/list',
	'method': 'GET',
	'handler': require('app/handlers/ListProjectsHandler.js')
});
server.route({
	'path': '/issues/labels/list',
	'method': 'GET',
	'handler': require('app/handlers/ListIssueLabelsHandler.js')
});

server.start(function() {
	console.log('Server started at: ' + server.info.uri);
});
