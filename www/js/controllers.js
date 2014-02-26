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
		var panelGroupId = 0,
			velocity = Sprints.calculateVelocity(statistics, naturalService);

		panelGroups.push({
			'id': panelGroupId++,
			'heading': 'Issue Labels',
			'accordions': velocity.groups,
			'footer': 'Total velocity: ' + velocity.totalVelocity
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

		$scope.issuesByTypes = { data: Sprints.groupIssuesByType(statistics) };
		$scope.closedIssuesByTypes = { data: Sprints.groupIssuesByType(statistics, true) };
		$scope.issuesByComponents = { data: Sprints.groupIssuesByComponent(statistics) };
		$scope.closedIssuesByComponents = { data: Sprints.groupIssuesByComponent(statistics, true) };
		$scope.projectName = statistics.projectName;
		$scope.sprintName = statistics.sprint.name;
		$scope.baseUrl = statistics.baseUrl;
		$scope.panelGroups = panelGroups;
		$scope.loading = false;
	});
}

exports.ProjectHistoryController = function($scope, $routeParams, $q, Sprints, naturalService) {
	$scope.loading = true;
	Sprints.getSprints($routeParams.projectId).then(function(sprints) {
		var sprintPromises = [],
			sprints = sprints.filter(function(sprint) { return sprint.state == 'CLOSED' });
		sprints.sort(function(a, b) {
			if (a.id < b.id) {
				return -1;
			} else {
				return 1;
			}
		});

		var start = Math.max(0, sprints.length - 10);
		for (var i = start; i < sprints.length; i++) {
			sprintPromises.push(Sprints.analyzeSprint($routeParams.projectId, sprints[i].id));
		}

		$q.all(sprintPromises).then(function(jiraSprints) {
			var issuesData = [],
				issuesAddedData = [],
				velocityData = [],
				sprint;
			for (var i = 0; i < jiraSprints.length; i++) {
				sprint = jiraSprints[i];
				issuesData.push({
					sprintId: sprint.sprint.id,
					sprint: sprint.sprint.name,
					incomplete: sprint.incompleteIssues.length,
					complete: sprint.completedIssues.length
				});
				issuesAddedData.push({
					sprintId: sprint.sprint.id,
					sprint: sprint.sprint.name,
					incomplete: sprint.incompletedAddedDuringSprintIssues.length,
					complete: sprint.completedAddedDuringSprintIssues.length
				});
				velocityData.push({
					sprintId: sprint.sprint.id,
					sprint: sprint.sprint.name,
					velocity: Sprints.calculateVelocity(sprint, naturalService).totalVelocity
				});
			}

			$scope.projectName = sprint.projectName;
			$scope.loading = false;
			$scope.issues = {
				'axis': 'Issues',
				'data': issuesData
			};
			$scope.addedIssues = {
				'axis': 'Issues',
				'data': issuesAddedData
			};
			$scope.velocity = {
				'axis': 'Velocity',
				'data': velocityData
			}
		});
	});
};
