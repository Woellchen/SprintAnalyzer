var config = require('app/config.js'),
	JiraApi = require('jira').JiraApi;

module.exports = new JiraApi('https', config.jira_host, null, config.jira_user, config.jira_password, 'latest', true, true);
