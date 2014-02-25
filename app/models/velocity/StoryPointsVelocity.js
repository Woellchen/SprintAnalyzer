var jira = require('app/models/Jira.js');

var storyPointField;
jira.listFields(function(error, fieldProperties) {
	var property;
	for (var i in fieldProperties) {
		property = fieldProperties[i];
		if ('Story Points' == property.name) {
			storyPointField = property.id;
			break;
		}
	}
});

function StoryPointsVelocity(config) {
	this.config = config;
}

StoryPointsVelocity.prototype.getVelocityValueMapping = function() {
	var groups = {};
	groups[this.config['default']] = 0;
	for (var i = this.config['story-points'].min; i <= this.config['story-points'].max; i++) {
		groups[i] = i;
	}

	return groups;
}

StoryPointsVelocity.prototype.groupIssues = function(issues) {
	var groups = {};
	groups[this.config['default']] = [];
	for (var i = this.config['story-points'].min; i <= this.config['story-points'].max; i++) {
		groups[i] = [];
	}

	for (var i in issues) {
		issue = issues[i];
		if (groups[issue.fields[storyPointField]]) {
			groups[issue.fields[storyPointField]].push(issue.key);
		} else {
			groups[this.config['default']].push(issue.key);
		}
	}

	return groups;
};

module.exports = StoryPointsVelocity;
