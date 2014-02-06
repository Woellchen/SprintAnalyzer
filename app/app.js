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
	'path': '/projects/{projectId}/sprints/list',
	'method': 'GET',
	'handler': require('app/handlers/ListSprintsHandler.js')
});
server.route({
	'path': '/issues/labels/list',
	'method': 'GET',
	'handler': require('app/handlers/ListIssueLabelsHandler.js')
});
server.route({
	'method': '*',
	'path': '/{p*}',
	'handler': function(request, reply) {
		reply('not found').code(404);
	}
});

server.start(function() {
	console.log('Server started at: ' + server.info.uri);
});
