var jira = require('app/models/Jira.js');

var listSprints = function(request, reply) {
	var projectId = request.params.projectId;

	jira.getSprintsForProject(projectId, function (error, sprints) {
		if (error) throw error; // maybe we should start thinking about error handling :D
		reply(sprints).type('application/json');
	});
};

module.exports = listSprints;
