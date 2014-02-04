var jira = require('app/models/Jira.js'),
	async = require('async');

var listIssueLabels = function(request, reply) {
	jira.findRapidView('Forge of Empires', function(error, rapidView) {
		if (error) {
			throw error;
		}

		jira.getAllSprintsForRapidView(rapidView.id, function(error, sprints) {
			if (error) {
				throw error;
			}

			var lastActiveSprint = null;
			while (lastActiveSprint = sprints.pop()) {
				if (lastActiveSprint.state === 'CLOSED') {
					break;
				}
			}

			jira.getSprintIssues(rapidView.id, lastActiveSprint.id, function(error, issues) {
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
				}

				async.parallel(tasks, function(error, results) {
					if (error) {
						throw error;
					}

					reply(results).type('application/json');
				});
			});
		});
	});
};

module.exports = listIssueLabels;
