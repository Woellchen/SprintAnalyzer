var jira = require('app/models/Jira.js'),
	async = require('async');

var analyzeSprint = function(request, reply) {
	var projectId = request.params.projectId;
	var sprintId = request.params.sprintId;

	jira.getProject(projectId, function(error, project) {
		if (error) {
			throw error;
		}

		jira.findRapidView(project.name, function(error, rapidView) {
			if (error) {
				throw error;
			}

			jira.getSprintIssues(rapidView.id, sprintId, function(error, issues) {
				if (error) {
					throw error;
				}

				var numIssuesAll = issues.contents.allIssuesEstimateSum.value;
				var numIssuesAddedDuringSprint = Object.keys(issues.contents.issueKeysAddedDuringSprint).length;
				var numIssuesIncomplete = issues.contents.incompletedIssuesEstimateSum.value;
				var numIssuesCompleted = issues.contents.completedIssuesEstimateSum.value;

				var numIssuesCompletedAddedDuringSprint = 0;
				var tasks = {};
				for (var i in issues.contents.completedIssues) {
					var completedIssue = issues.contents.completedIssues[i];

					tasks[completedIssue.key] = function(issueId) {
						return function(callback) {
							jira.findIssue(issueId, function(error, data) {
								if (error) {
									callback(error, null);
								} else {
									callback(null, data.fields.labels);
								}
							});
						};
					}(completedIssue.id);

					if (issues.contents.issueKeysAddedDuringSprint[completedIssue.key] === true) {
						numIssuesCompletedAddedDuringSprint++;
					}
				}
				for (var i in issues.contents.incompletedIssues) {
					var incompleteIssue = issues.contents.incompletedIssues[i];

					tasks[incompleteIssue.key] = function(issueId) {
						return function(callback) {
							jira.findIssue(issueId, function(error, data) {
								if (error) {
									callback(error, null);
								} else {
									callback(null, data.fields.labels);
								}
							});
						};
					}(incompleteIssue.id);
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
					for (var issueKey in allIssueLabels) {
						var issueLabels = allIssueLabels[issueKey];

						for (var i in issueLabels) {
							var issueLabel = issueLabels[i];

							if (labels[issueLabel]) {
								labels[issueLabel]++;
							}
						}
					}

					var response = {
						'numIssuesAll': numIssuesAll,
						'numIssuesAddedDuringSprint': numIssuesAddedDuringSprint,
						'numIssuesIncomplete': numIssuesIncomplete,
						'numIssuesCompleted': numIssuesCompleted,
						'numIssuesCompletedAddedDuringSprint': numIssuesCompletedAddedDuringSprint,
						'labels': labels
					};

					reply(response).type('application/json');
				});
			});
		});
	});
};

module.exports = analyzeSprint;
