var LabelVelocity = require('app/models/velocity/LabelVelocity'),
	StoryPointsVelocity = require('app/models/velocity/StoryPointsVelocity');

function VelocityFactory() {

}

VelocityFactory.prototype.getVelocity = function(velocityConfig) {
	switch (velocityConfig.type) {
		case 'labels':
			return new LabelVelocity(velocityConfig);
		case 'story-points':
			return new StoryPointsVelocity(velocityConfig);
		default:
			throw new Error('unknown velocity type: ' + velocityConfig.type);
	}
};

module.exports = VelocityFactory;
