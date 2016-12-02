var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var SettingsSchema = new Schema({
	noveltyCount: Number,
	tradingLot: Number,
	prolongTime: Number,
	betSteps: {
		fromNull: Number,
		fromOneMile: Number,
		fromTwoMile: Number,
		fromFiveMile: Number,
		fromTenMile: Number,
		fromTwentyMile: Number,
		fromFiftyMile: Number,
		fromOneHundredMile: Number,
		fromTwoHundredMile: Number,
		fromFiveHundredMile: Number
	}
});

module.exports = mongoose.model('Settings', SettingsSchema);