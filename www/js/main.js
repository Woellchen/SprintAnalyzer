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

	.config(function($routeProvider) {
		$routeProvider
			.when('/', {
				controller: 'ProjectListController',
				templateUrl: 'project-list.html'
			})
			.otherwise({
				redirectTo: '/'
			});
	})

	.controller('ProjectListController', function($scope, Projects) {
		Projects.getProjects().then(function(projects) {
			$scope.projects = projects;
		});
	});
