var config = require('app/config/config'),
	JiraApi = require('jira').JiraApi;

module.exports = new JiraApi('https', config.jira.host, null, config.jira.user, config.jira.password, config.jira.api_version, true, true);
