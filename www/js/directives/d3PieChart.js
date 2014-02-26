var d3 = require('d3');

angular.module('d3Helper')
	.directive('d3PieChart', function() {
		return {
			restrict: 'EA',
			scope: {
				data: "=",
				label: "@"
			},
			link: function(scope, iElement, iAttrs) {
				var container = d3.select(iElement[0])
					.append("svg")
					.attr("width", "100%")
					.attr("height", "250");

				// on window resize, re-render d3 canvas
				window.onresize = function() {
					return scope.$apply();
				};

				// watch for data changes and re-render
				scope.$watch('data', function(newVals, oldVals) {
					return scope.render(newVals);
				}, true);

				// define render function
				scope.render = function(allData){
					if (!allData) return;

					// remove all previous items before render
					container.selectAll("*").remove();

					var data = allData.data;

					// setup variables
					var margin = {top: 0, right: 0, bottom: 0, left: 0},
						width = d3.select(iElement[0])[0][0].offsetWidth - margin.left - margin.right,
						height = 250 - margin.top - margin.bottom,
						radius = Math.min(width, height) / 2;

					var color = d3.scale.ordinal()
						.range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

					var arc = d3.svg.arc()
						.outerRadius(radius - 10)
						.innerRadius(0);

					var pie = d3.layout.pie()
						.sort(null)
						.value(function(d) { return d.count; });

					var svg = container
						.append("g")
						.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
					
					data.forEach(function(d) {
						d.count = +d.count;
					});

					var g = svg.selectAll(".arc")
						.data(pie(data))
						.enter().append("g")
						.attr("class", "arc");

					g.append("path")
						.attr("d", arc)
						.style("fill", function(d) { return color(d.data.label); });

					var getAngle = function (d) {
						return (180 / Math.PI * (d.startAngle + d.endAngle) / 2 - 270);
					};

					g.append("text")
						.attr("transform", function(d) {
							return "translate(" + arc.centroid(d) + ") " +
								"rotate(" + getAngle(d) + ")"; })
						.attr("dy", "0em")
						.style("text-anchor", "middle")
						.text(function(d) { return d.data.label; });

				};
			}
		};
	});
