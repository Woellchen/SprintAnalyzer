angular.module('main', ['ngRoute'])

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

		return {
			getSprints: getSprints,
			analyzeSprint: analyzeSprint
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

	.controller('SprintAnalyzeController', function($scope, $routeParams, Sprints) {
		$scope.loading = true;
		Sprints.analyzeSprint($routeParams.projectId, $routeParams.sprintId).then(function(statistics) {
			var labels = [];
			for (var name in statistics.labels) {
				labels.push({
					'name': name,
					'value': statistics.labels[name]
				})
			}

			var numbers = [
				{
					'name': 'All Issues',
					'value': statistics.numIssuesAll
				},
				{
					'name': 'Issues Completed',
					'value': statistics.numIssuesCompleted
				},
				{
					'name': 'Issues Incomplete',
					'value': statistics.numIssuesIncomplete
				},
				{
					'name': 'Issues Added During Sprint',
					'value': statistics.numIssuesAddedDuringSprint
				},
				{
					'name': 'Issues Completed Added During Sprint',
					'value': statistics.numIssuesCompletedAddedDuringSprint
				}
			];

			$scope.labels = labels;
			$scope.numbers = numbers;
			$scope.loading = false;
		});
	});
