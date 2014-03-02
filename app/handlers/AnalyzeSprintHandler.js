var config = require('app/config/config'),
	jira = require('app/models/Jira.js'),
	Q = require('q'),
	Storage = require('app/models/Storage'),
	VelocityFactory = require('app/models/velocity/VelocityFactory'),
	ProjectConfig = require('app/models/ProjectConfig'),
	storage = new Storage(),
	velocityFactory = new VelocityFactory(),
	projectConfig = new ProjectConfig();

var getProject = function(projectId) {
	var deferred = Q.defer();
	jira.getProject(projectId, function(error, project) {
		if (error) {
			return deferred.reject(error);
		}

		deferred.resolve(project);
	});

	return deferred.promise;
};

var findRapidView = function(project) {
	var deferred = Q.defer();
	jira.findRapidView(project.name, function(error, rapidView) {
		if (error) {
			return deferred.reject(error);
		}

		deferred.resolve(rapidView);
	});

	return deferred.promise;
};

var getSprintIssues = function(sprintId) {
	return function(rapidView) {
		var deferred = Q.defer();
		jira.getSprintIssues(rapidView.id, sprintId, function(error, issues) {
			if (error) {
				return deferred.reject(error);
			}

			deferred.resolve(issues);
		});

		return deferred.promise;
	}
};

var findIssue = function(issueId) {
	var deferred = Q.defer();
	jira.findIssue(issueId, function(error, issue) {
		if (error) {
			return deferred.reject(error);
		}

		deferred.resolve(issue);
	});

	return deferred.promise;
};

var analyzeSprint = function(request, reply) {
	storage.getSprint(request.params.sprintId, function(error, sprintData) {

		var velocityConfig = projectConfig.getConfigForProject(request.params.projectId).velocity;
		var velocity = velocityFactory.getVelocity(velocityConfig);

		if (sprintData) {
			sprintData.velocity.valueMapping = velocity.getVelocityValueMapping();
			sprintData.velocity.issueMapping = velocity.groupIssues(sprintData.jiraIssues);
			reply(sprintData).type('application/json');
		} else {
			var projectId = request.params.projectId;
			var sprintId = request.params.sprintId;
			var response = {
				'projectName': '',
				'sprintName': '',
				'baseUrl': 'https://' + config.jira.host + ':' + config.jira.port + '/browse/',
				'allIssues': [],
				'completedIssues': [],
				'incompleteIssues': [],
				'addedDuringSprintIssues': [],
				'completedAddedDuringSprintIssues': [],
				'incompletedAddedDuringSprintIssues': [],
				'velocity': {}
			};

			getProject(projectId).then(function(project) {
				response.projectName = project.name;

				findRapidView(project).then(getSprintIssues(sprintId)).then(function(issues) {
					response.sprint = issues.sprint;

					var issuePromises = [];
					for (var i in issues.contents.completedIssues) {
						var issue = issues.contents.completedIssues[i];

						response.allIssues.push(issue.key);
						response.completedIssues.push(issue.key);
						issuePromises.push(findIssue(issue.id));

						if (issues.contents.issueKeysAddedDuringSprint[issue.key] === true) {
							response.addedDuringSprintIssues.push(issue.key);
							response.completedAddedDuringSprintIssues.push(issue.key);
						}
					}
					for (var i in issues.contents.incompletedIssues) {
						var issue = issues.contents.incompletedIssues[i];

						response.allIssues.push(issue.key);
						response.incompleteIssues.push(issue.key);
						issuePromises.push(findIssue(issue.id));

						if (issues.contents.issueKeysAddedDuringSprint[issue.key] === true) {
							response.addedDuringSprintIssues.push(issue.key);
							response.incompletedAddedDuringSprintIssues.push(issue.key);
						}
					}

					Q.all(issuePromises).then(function(jiraIssues) {
						var issues = {};
						for (var i in jiraIssues) {
							issues[jiraIssues[i].key] = jiraIssues[i];
						}

						response.jiraIssues = issues;

						if ('CLOSED' === response.sprint.state) {
							storage.storeSprint(request.params.sprintId, response);
						}
						response.velocity.valueMapping = velocity.getVelocityValueMapping();
						response.velocity.issueMapping = velocity.groupIssues(issues);

						reply(response).type('application/json');
					});
				});
			});
		}
	});
};

module.exports = analyzeSprint;
