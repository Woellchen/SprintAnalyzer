require('angular/angular');
require('angular-route/angular-route');

angular.module('d3Helper', []);

require('./naturalSort');
var controllers = require('./controllers');
require('./directives/d3StackedBars');

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

		return {
			getSprints: getSprints,
			analyzeSprint: analyzeSprint,
			getNumCompletedIssues: getNumCompletedIssues,
			getAccumulatedVelocity: getAccumulatedVelocity
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
app.controller('ProjectHistoryController', ['$scope', '$routeParams', '$q', 'Sprints', controllers.ProjectHistoryController]);
