'use strict';

exports.ProjectListController = function($scope, Projects) {
	$scope.loading = true;
	Projects.getProjects().then(function(projects) {
		$scope.projects = projects;
		$scope.loading = false;
	});
};

exports.SprintListController = function($scope, $routeParams, Sprints) {
	$scope.loading = true;
	Sprints.getSprints($routeParams.projectId).then(function(sprints) {
		$scope.projectId = $routeParams.projectId;
		$scope.sprints = sprints;
		$scope.loading = false;
	});
}

exports.SprintAnalyzeController = function($scope, $routeParams, Sprints, Socket, naturalService) {
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

			if (statistics.velocity.issueMapping[name].length > 0) {
				labels.push({
					'name': name,
					'info': 'completed ' + numCompletedLabelIssues + '/' + statistics.velocity.issueMapping[name].length,
					'issues': statistics.velocity.issueMapping[name]
				});
			}
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
}
