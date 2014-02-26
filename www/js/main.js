require('angular/angular');
require('angular-route/angular-route');

angular.module('d3Helper', []);

require('./naturalSort');
var controllers = require('./controllers');
require('./directives/d3StackedBars');
require('./directives/d3PieChart');

var app = angular.module('main', ['ngRoute', 'naturalSort', 'd3Helper'])

	.factory('Projects', function($q, $http) {
		var getProjects = function() {
			var deferred = $q.defer();

			$http.get('/projects/list').success(function(projects) {
				deferred.resolve(projects);
			});

			return deferred.promise;
		};

		return {
			getProjects: getProjects
		};
	})

	.factory('Sprints', function($q, $http) {
		var getSprints = function(projectId) {
			var deferred = $q.defer();

			$http.get('/projects/' + projectId + '/sprints/list').success(function(sprints) {
				deferred.resolve(sprints);
			});

			return deferred.promise;
		};

		var analyzeSprint = function(projectId, sprintId) {
			var deferred = $q.defer();

			$http.get('/projects/' + projectId + '/sprints/' + sprintId + '/analyze').success(function(statictics) {
				deferred.resolve(statictics);
			});

			return deferred.promise;
		};

		var getNumCompletedIssues = function(undeterminedIssues, completedIssues) {
			var num = 0;
			if (undeterminedIssues.length === 0 || completedIssues.length === 0) {
				return num;
			}

			for (var i in undeterminedIssues) {
				if (completedIssues.indexOf(undeterminedIssues[i]) > -1) {
					num++;
				}
			}

			return num;
		};

		var getAccumulatedVelocity = function(valueMapping, labelName, numIssues) {
			return valueMapping[labelName] * numIssues;
		};

		var calculateVelocity = function(statistics, naturalService) {
			var totalVelocity = 0,
				numCompletedLabelIssues = 0,
				groups = [];
			for (var name in statistics.velocity.issueMapping) {
				statistics.velocity.issueMapping[name].sort(naturalService.naturalSort);
				numCompletedLabelIssues = getNumCompletedIssues(statistics.velocity.issueMapping[name], statistics.completedIssues);
				totalVelocity += getAccumulatedVelocity(statistics.velocity.valueMapping, name, numCompletedLabelIssues);

				if (statistics.velocity.issueMapping[name].length > 0) {
					groups.push({
						'name': name,
						'info': 'completed ' + numCompletedLabelIssues + '/' + statistics.velocity.issueMapping[name].length,
						'issues': statistics.velocity.issueMapping[name]
					});
				}
			}


			return {
				'totalVelocity': totalVelocity,
				'groups': groups
			}
		};

		var groupIssuesByMapping = function(mapping) {
			var types = [];
			for (var j in mapping) {
				types.push({
					'label': "(" + mapping[j] + ") " + j,
					'count': mapping[j]
				});
			}

			return types;
		}

		var groupIssuesByType = function(statistics, closedOnly) {
			var typesMapping = {},
				issueType,
				issue;
			for (var i in statistics.jiraIssues) {
				issue = statistics.jiraIssues[i];
				if (!closedOnly || -1 !== statistics.completedIssues.indexOf(issue.key)) {
					issueType = issue.fields.issuetype.name;
					if (!typesMapping[issueType]) {
						typesMapping[issueType] = 0;
					}

					typesMapping[issueType]++;
				}
			}

			return groupIssuesByMapping(typesMapping);
		};

		var groupIssuesByComponent = function(statistics, closedOnly) {
			var mapping = {},
				component,
				issue;
			for (var i in statistics.jiraIssues) {
				issue = statistics.jiraIssues[i];
				if (!closedOnly || -1 !== statistics.completedIssues.indexOf(issue.key)) {
					for (var j in issue.fields.components) {
						component = issue.fields.components[j].name;
						if (!mapping[component]) {
							mapping[component] = 0;
						}

						mapping[component]++;
					}
				}
			}

			return groupIssuesByMapping(mapping);
		};

		return {
			getSprints: getSprints,
			analyzeSprint: analyzeSprint,
			getNumCompletedIssues: getNumCompletedIssues,
			getAccumulatedVelocity: getAccumulatedVelocity,
			calculateVelocity: calculateVelocity,
			groupIssuesByType: groupIssuesByType,
			groupIssuesByComponent: groupIssuesByComponent
		};
	})

	.factory('Socket', function($rootScope) {
		var socket = io.connect();

		var applyCallback = function(arguments, callback) {
			$rootScope.$apply(function() {
				callback.apply(socket, arguments);
			});
		};
		var on = function(event, callback) {
			socket.on(event, function() {
				applyCallback(arguments, callback);
			});
		};
		var emit = function(event, data, callback) {
			socket.emit(event, data, function() {
				applyCallback(arguments, callback);
			});
		};

		return {
			'on': on,
			'emit': emit
		};
	})

app.config(function($routeProvider) {
	$routeProvider
		.when('/', {
			controller: 'ProjectListController',
			templateUrl: '/html/project-list.html'
		})
		.when('/project/:projectId', {
			controller: 'SprintListController',
			templateUrl: '/html/sprint-list.html'
		})
		.when('/projects/:projectId/sprints/:sprintId', {
			controller: 'SprintAnalyzeController',
			templateUrl: '/html/sprint-analyze.html'
		})
		.when('/project/:projectId/history', {
			controller: 'ProjectHistoryController',
			templateUrl: '/html/project-history.html'
		})
		.otherwise({
			redirectTo: '/'
		});
});

app.controller('ProjectListController', ['$scope', 'Projects', controllers.ProjectListController]);
app.controller('SprintListController', ['$scope', '$routeParams', 'Sprints', controllers.SprintListController]);
app.controller('SprintAnalyzeController', ['$scope', '$routeParams', 'Sprints', 'Socket', 'naturalService', controllers.SprintAnalyzeController]);
app.controller('ProjectHistoryController', ['$scope', '$routeParams', '$q', 'Sprints', 'naturalService', controllers.ProjectHistoryController]);
