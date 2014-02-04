var config = require('app/config.js');
JiraApi = require('jira').JiraApi;

var jira = new JiraApi('https', config.host, null, config.user, config.password, 'latest', true, true);

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
			for (var i in issues.contents.completedIssues) {
				var completedIssue = issues.contents.completedIssues[i];

				jira.findIssue(completedIssue.id, function(error, data) {
					console.log('labels for %s: %s', data.key, data.fields.labels);
				});
			}
		});
	});
});
