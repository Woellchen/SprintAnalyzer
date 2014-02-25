var fs = require("fs");

var configs = {};
fs.readdirSync("app/config/projects").forEach(function(file) {
	if (file.length - 5 === file.indexOf('.json')) {
		var project = require("app/config/projects/" + file);
		configs[project.projectId] = project;
	}
});

function ProjectConfig() {

}

ProjectConfig.prototype.getConfigForProject = function (projectId) {
	if (configs[projectId]) {
		return configs[projectId];
	}

	return configs['default'];
};

module.exports = ProjectConfig;
