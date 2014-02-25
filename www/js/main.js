require('angular/angular');
require('angular-route/angular-route');

require('./naturalSort');

angular.module('main', ['ngRoute', 'naturalSort'])

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

	.config(function($routeProvider) {
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
			.otherwise({
				redirectTo: '/'
			});
	})

	.controller('ProjectListController', function($scope, Projects) {
		$scope.loading = true;
		Projects.getProjects().then(function(projects) {
			$scope.projects = projects;
			$scope.loading = false;
		});
	})

	.controller('SprintListController', function($scope, $routeParams, Sprints) {
		$scope.loading = true;
		Sprints.getSprints($routeParams.projectId).then(function(sprints) {
			$scope.projectId = $routeParams.projectId;
			$scope.sprints = sprints;
			$scope.loading = false;
		});
	})

	.controller('SprintAnalyzeController', function($scope, $routeParams, Sprints, Socket, naturalService) {
		$scope.loading = true;
		Sprints.analyzeSprint($routeParams.projectId, $routeParams.sprintId).then(function(statistics) {
			var panelGroups = [];
			var panelGroupId = 0;
			var totalVelocity = 0;

			var labels = [];
			for (var name in statistics.velocity.issueMapping) {
				statistics.velocity.issueMapping[name].sort(naturalService.naturalSort);
				var numCompletedLabelIssues = Sprints.getNumCompletedIssues(statistics.velocity.issueMapping[name], statistics.completedIssues);
				totalVelocity += Sprints.getAccumulatedVelocity(statistics.velocity.valueMapping, name, numCompletedLabelIssues);

				labels.push({
					'name': name,
					'info': 'completed ' + numCompletedLabelIssues + '/' + statistics.velocity.issueMapping[name].length,
					'issues': statistics.velocity.issueMapping[name]
				});
			}
			panelGroups.push({
				'id': panelGroupId++,
				'heading': 'Issue Labels',
				'accordions': labels,
				'footer': 'Total velocity: ' + totalVelocity
			});

			statistics.allIssues.sort(naturalService.naturalSort);
			statistics.completedIssues.sort(naturalService.naturalSort);
			statistics.incompleteIssues.sort(naturalService.naturalSort);
			statistics.addedDuringSprintIssues.sort(naturalService.naturalSort);
			statistics.completedAddedDuringSprintIssues.sort(naturalService.naturalSort);
			statistics.incompletedAddedDuringSprintIssues.sort(naturalService.naturalSort);

			var numbers = [
				{
					'name': 'All Issues',
					'issues': statistics.allIssues
				},
				{
					'name': 'Issues Completed',
					'issues': statistics.completedIssues
				},
				{
					'name': 'Issues Incomplete',
					'issues': statistics.incompleteIssues
				},
				{
					'name': 'Issues Added During Sprint',
					'issues': statistics.addedDuringSprintIssues
				},
				{
					'name': 'Issues Completed Added During Sprint',
					'issues': statistics.completedAddedDuringSprintIssues
				},
				{
					'name': 'Issues Incomplete Added During Sprint',
					'issues': statistics.incompletedAddedDuringSprintIssues
				}
			];
			panelGroups.push({
				'id': panelGroupId++,
				'heading': 'Issue Statistics',
				'accordions': numbers
			});

			$scope.projectName = statistics.projectName;
			$scope.sprintName = statistics.sprint.name;
			$scope.baseUrl = statistics.baseUrl;
			$scope.panelGroups = panelGroups;
			$scope.loading = false;
		});
	});
