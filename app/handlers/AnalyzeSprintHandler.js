var config = require('app/config'),
	jira = require('app/models/Jira.js'),
	Q = require('q'),
	Storage = require('../models/Storage'),
	storage = new Storage();

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

var calculateLables = function(jiraIssues) {
	var labels = {
		'XS': [],
		'S': [],
		'M': [],
		'L': [],
		'XL': [],
		'?_size_unclear': [],
		'Without': []
	};
	var labelsTotal = 0;

	for (var i in jiraIssues) {
		var issueLabels = jiraIssues[i].fields.labels;

		if (issueLabels.length === 0) {
			labels['Without'].push(jiraIssues[i].key);
		} else {
			for (var j in issueLabels) {
				var issueLabel = issueLabels[j];

				if (typeof labels[issueLabel] !== 'undefined') {
					labels[issueLabel].push(jiraIssues[i].key);
					labelsTotal++;
				}
			}
		}
	}

	return labels;
}

var analyzeSprint = function(request, reply) {
	storage.getSprint(request.params.sprintId, function(error, sprintData) {
		if (sprintData) {
			sprintData.labels = calculateLables(sprintData.jiraIssues);
			reply(sprintData).type('application/json');
		} else {
			var projectId = request.params.projectId;
			var sprintId = request.params.sprintId;
			var response = {
				'projectName': '',
				'sprintName': '',
				'baseUrl': 'https://' + config.jira_host + ':' + config.jira_port + '/browse/',
				'allIssues': [],
				'completedIssues': [],
				'incompleteIssues': [],
				'addedDuringSprintIssues': [],
				'completedAddedDuringSprintIssues': [],
				'incompletedAddedDuringSprintIssues': [],
				'labels': {},
				'labelVelocity': {
					'XS': 1,
					'S': 2,
					'M': 8,
					'L': 13,
					'XL': 40,
					'?_size_unclear': 0,
					'Without': 0
				}
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
						response.jiraIssues = jiraIssues;

						if ('CLOSED' === response.sprint.state) {
							storage.storeSprint(request.params.sprintId, response);
						}
						response.labels = calculateLables(jiraIssues);

						reply(response).type('application/json');
					});
				});
			});
		}
	});
};

module.exports = analyzeSprint;
