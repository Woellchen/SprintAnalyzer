function LabelVelocity(config) {
	this.config = config;
}

LabelVelocity.prototype.getVelocityValueMapping = function() {
	return this.config.labels;
}

LabelVelocity.prototype.groupIssues = function(issues) {
	var labels = {};
	for (var label in this.config.labels) {
		labels[label] = [];
	}

	var labelsTotal = 0,
		issue,
		issueLabels;

	for (var i in issues) {
		issue = issues[i];
		issueLabels = issue.fields.labels;

		if (issueLabels.length === 0) {
			labels[this.config.defaultLabel].push(issue.key);
		} else {
			for (var j in issueLabels) {
				var issueLabel = issueLabels[j];

				if (typeof labels[issueLabel] !== 'undefined') {
					labels[issueLabel].push(issue.key);
					labelsTotal++;
				}
			}
		}
	}

	return labels;
};

module.exports = LabelVelocity;
