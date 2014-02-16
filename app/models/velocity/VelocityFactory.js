var LabelVelocity = require('app/models/velocity/LabelVelocity');

function VelocityFactory() {

}

VelocityFactory.prototype.getVelocity = function(config) {
	switch (config.type) {
		case 'labels':
			return new LabelVelocity(config);
		default:
			throw new Error('unknown velocity type: ' + config.type);
	}
};

module.exports = VelocityFactory;
