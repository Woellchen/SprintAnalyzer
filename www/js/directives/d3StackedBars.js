var d3 = require('d3');

angular.module('d3Helper')
	.directive('d3StackedBars', function() {
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
					var margin = {top: 10, right: 40, bottom: 50, left: 50},
						width = d3.select(iElement[0])[0][0].offsetWidth - 60,
						height = 250 - margin.top - margin.bottom;

					var x = d3.scale.ordinal()
						.rangeRoundBands([0, width], .1);

					var y = d3.scale.linear()
						.rangeRound([height, 0]);

					var color = d3.scale.ordinal()
						.range(["#bb0000", "#00bb00"]);

					var xAxis = d3.svg.axis()
						.scale(x)
						.tickSize(2)
						.orient("bottom");

					var yAxis = d3.svg.axis()
						.scale(y)
						.orient("left")
						.tickSize(2)
						.tickFormat(d3.format(".2s"));

					var svg =
						container.append('g')
						.attr("height", height + margin.top + margin.bottom)
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

					color.domain(d3.keys(data[0]).filter(function(key) { return key !== "sprint" && key !== "mapping" && key !== "total" && key !== "sprintId"; }));

					data.forEach(function(d) {
						var y0 = 0;
						d.mapping = color.domain().map(function(name) { return {name: name, y0: y0, y1: y0 += +d[name]}; });
						d.total = d.mapping[d.mapping.length - 1].y1;
					});

					data.sort(function(a, b) { return a.sprintId - b.sprintId; });

					x.domain(data.map(function(d) { return d.sprint; }));
					y.domain([0, d3.max(data, function(d) { return d.total; })]);

					svg.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + height + ")")
						.attr("stroke-width", "2")
						.call(xAxis)
						.selectAll("text")
							.style("text-anchor", "end")
							.attr("dx", ".2em")
							.attr("dy", "1.0em")
							.style("font-size", "8px")
							.attr("transform", function(d) {
								return "rotate(-20)"
							});

					svg.append("g")
						.attr("class", "y axis")
						.call(yAxis)
						.append("text")
						.attr("transform", "rotate(-90)")
						.attr("y", 6)
						.attr("dy", ".71em")
						.style("text-anchor", "end")
						.text(data.axis);

					var state = svg.selectAll(".state")
						.data(data)
						.enter().append("g")
						.attr("class", "g")
						.attr("transform", function(d) { return "translate(" + x(d.sprint) + ",0)"; })
						;

					state.selectAll("rect")
						.data(function(d) { return d.mapping; })
						.enter().append("rect")
						.attr("width", x.rangeBand())
						.attr("y", function(d) { return y(d.y1); })
						.attr("height", function(d) { return y(d.y0) - y(d.y1); })
						.style("fill", function(d) { return color(d.name); });

					var legend = svg.selectAll(".legend")
						.data(color.domain().slice().reverse())
						.enter().append("g")
						.attr("class", "legend")
						.attr("transform", function(d, i) { return "translate(20," + i * 20 + ")"; })
						;

					legend.append("rect")
						.attr("x", width - 18)
						.attr("width", 18)
						.attr("height", 18)
						.style("fill", color);

					legend.append("text")
						.attr("x", width - 24)
						.attr("y", 9)
						.attr("dy", ".35em")
						.style("text-anchor", "end")
						.text(function(d) { return d; });

				};
			}
		};
	});
