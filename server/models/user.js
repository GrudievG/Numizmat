
// grab the mongoose module
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var bcrypt   = require('bcrypt-nodejs');
var Order    = require('./order');
var Lot    = require('./lot');
var Product    = require('./product');


var UserSchema = new Schema({
	email: {
		type: String,
		required: true,
		index: {
			unique:true
		}
	},
	password: {
		type: String,
		required: true,
		select: false
	},
	name: String,
    surname: String,
    active: Boolean,
    tel: String,
    country: String,
    region: String,
    locality: String,
    postIndex: String,
    address: String,
    basket: [{type: Schema.Types.ObjectId, ref: 'Product'}],
    bets: [{
    	lot: {type: Schema.Types.ObjectId, ref: 'Lot'},
    	price: Number
    }],
    admin: Boolean,
    super: Boolean,
    orders: [{type: Schema.Types.ObjectId, ref: 'Order'}],
    reset: {
    	token: String,
    	expires: String
    },
    dropPass: {
    	expires: String,
    	status: String
    }
});

UserSchema.pre('save', function(next) {
	var user = this;
	// hash the password only if the password has been changed or user is new
	if (!user.isModified('password')) return next();
	// generate the hash
	bcrypt.hash(user.password, null, null, function(err, hash) {
	if (err) return next(err);
	// change the password to the hashed version
	user.password = hash;
	next();
	});
});

UserSchema.methods.comparePassword = function(password) {
	var user = this;

	return bcrypt.compareSync(password, user.password);
};

// define our user model
module.exports = mongoose.model('User', UserSchema);