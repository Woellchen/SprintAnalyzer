var config = require('app/config');
var Hapi = require('hapi');

var server = new Hapi.Server(config.app.host, config.app.port);

server.route({
	'path': '/html/{path*}',
	'method': 'GET',
	'handler': {
		'directory': {
			'path': __dirname + '/../www/html'
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
	'path': '/projects/{projectId}/sprints/{sprintId}/analyze',
	'method': 'GET',
	'handler': require('app/handlers/AnalyzeSprintHandler.js')
});
server.route({
	'method': '*',
	'path': '/{p*}',
	'handler': function(request, reply) {
		reply('not found').code(404);
	}
});

var moonboots_config = {
	main: __dirname + '/../www/js/main.js',
	developmentMode: config.app.debug,
	templateFile: __dirname + '/../www/index.html',
	libraries: [
		__dirname + '/../www/js/jquery.min.js',
		__dirname + '/../www/js/bootstrap.min.js'
	],
	stylesheets: [
		__dirname + '/../www/css/bootstrap.min.css'
	]
};


var io = require('socket.io');

server.pack.require({moonboots_hapi: moonboots_config}, function (err) {
	server.start(function() {
		io.listen(server.listener);

		console.log('Server started at: ' + server.info.uri);
	});
});
