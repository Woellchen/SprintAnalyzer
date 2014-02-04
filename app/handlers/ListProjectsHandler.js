var jira = require('app/models/Jira.js');

var listProjects = function(request, reply) {
	jira.listProjects(function(error, jiraProjects) {
		if (error) {
			throw error;
		}

		var projects = {};
		for (var i in jiraProjects) {
			var jiraProject = jiraProjects[i];

			projects[jiraProject.id] = jiraProject.name;
		}

		reply(projects).type('application/json');
	});
};

module.exports = listProjects;
