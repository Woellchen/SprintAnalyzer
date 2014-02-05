$(function() {
	$.get('/projects/list', function(projects) {
		$list = $('<ul></ul>');
		for (var projectId in projects) {
			$list.append('<li>' + projects[projectId] + '</li>');
		}

		$('#projects-list').html($list);
	});
});
