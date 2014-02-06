var jira = require('app/models/Jira.js');

var listSprints = function(request, reply) {
	var projectId = request.params.projectId;

	jira.getProject(projectId, function(error, project) {
		jira.findRapidView(project.name, function(error, rapidView) {
			jira.getAllSprintsForRapidView(rapidView.id, function(error, sprints) {
				reply(sprints).type('application/json');
			});
		});
	});
};

module.exports = listSprints;
