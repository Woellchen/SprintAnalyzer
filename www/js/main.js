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

		return {
			getSprints: getSprints
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
			$scope.sprints = sprints;
			$scope.loading = false;
		});
	});
