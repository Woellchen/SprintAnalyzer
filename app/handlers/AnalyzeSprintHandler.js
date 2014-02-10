var config = require('app/config.js'),
	jira = require('app/models/Jira.js'),
	async = require('async'),
	Q = require('q');

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

var analyzeSprint = function(request, reply) {
	var projectId = request.params.projectId;
	var sprintId = request.params.sprintId;

	getProject(projectId).then(findRapidView).then(getSprintIssues(sprintId)).then(function(issues) {
		var numIssuesAll = issues.contents.allIssuesEstimateSum.value;
		var numIssuesAddedDuringSprint = Object.keys(issues.contents.issueKeysAddedDuringSprint).length;
		var numIssuesIncomplete = issues.contents.incompletedIssuesEstimateSum.value;
		var numIssuesCompleted = issues.contents.completedIssuesEstimateSum.value;

		var numIssuesCompletedAddedDuringSprint = 0;
		var tasks = {};

		var allIssues = issues.contents.completedIssues.concat(issues.contents.incompletedIssues);
		for (var i in allIssues) {
			var issue = allIssues[i];

			tasks[issue.key] = function(issueId) {
				return function(callback) {
					jira.findIssue(issueId, function(error, data) {
						if (error) {
							callback(error, null);
						} else {
							callback(null, data.fields.labels);
						}
					});
				};
			}(issue.id);

			if (issues.contents.issueKeysAddedDuringSprint[issue.key] === true && issue.status.id === config.jira_status_closed_id) {
				numIssuesCompletedAddedDuringSprint++;
			}
		}

		async.parallel(tasks, function(error, allIssueLabels) {
			if (error) {
				throw error;
			}

			var labels = {
				'XS': 0,
				'S': 0,
				'M': 0,
				'L': 0,
				'XL': 0,
				'XXL': 0,
				'?_size_unclear': 0
			};
			var labelsTotal = 0;
			for (var issueKey in allIssueLabels) {
				var issueLabels = allIssueLabels[issueKey];

				for (var i in issueLabels) {
					var issueLabel = issueLabels[i];

					if (typeof labels[issueLabel] !== 'undefined') {
						labels[issueLabel]++;
						labelsTotal++;
					}
				}
			}

			var response = {
				'numIssuesAll': numIssuesAll,
				'numIssuesAddedDuringSprint': numIssuesAddedDuringSprint,
				'numIssuesIncomplete': numIssuesIncomplete,
				'numIssuesCompleted': numIssuesCompleted,
				'numIssuesCompletedAddedDuringSprint': numIssuesCompletedAddedDuringSprint,
				'numIssuesWithoutLabel': numIssuesAll - labelsTotal,
				'labels': labels
			};

			reply(response).type('application/json');
		});
	});
};

module.exports = analyzeSprint;
