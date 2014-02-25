var config = require('app/config/config'),
	JiraApi = require('jira').JiraApi,
	ProjectConfig = require('app/models/ProjectConfig'),
	projectConfig = new ProjectConfig();

JiraApi.prototype.getSprintsForProject = function (projectId, callback) {
	var self = this;
	self.getProject(projectId, function(error, project) {
		if (error) return callback(error, null);
		self.findRapidView(project.name, function(error, rapidView) {
			if (error) return callback(error, null);
			self.getAllSprintsForRapidView(rapidView.id, function(error, sprints) {
				if (error) return callback(error, null);
				self.getBacklogForRapidView(rapidView.id, function(error, data) {
					if (error) return callback(error, null);

					while (data.sprints.length) {
						var backlogSprint = data.sprints.pop();
						if (backlogSprint.state !== 'FUTURE') {
							continue;
						}

						sprints.push(backlogSprint);
					}

					var sprintBlacklist = projectConfig.getConfigForProject(projectId).sprintBlacklist,
						filteredSprints = [],
						sprint;
					for (var i = 0; i < sprints.length; i++) {
						sprint = sprints[i];
						if (-1 === sprintBlacklist.indexOf(sprint.id)) {
							filteredSprints.push(sprint);
						}
					}

					callback(null, filteredSprints);
				});
			});
		});
	});
};

module.exports = new JiraApi('https', config.jira.host, null, config.jira.user, config.jira.password, config.jira.api_version, true, true);
