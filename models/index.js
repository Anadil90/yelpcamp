const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

// Schema setup
const campgroundsSchema = new mongoose.Schema({
	name: String,
	price: String,
	image: String,
	description: String,
	createdAt: {type: Date, Default: Date.now},
	author: {
	id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user'
		},
		username: String
	},  
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'comment'
		}
	]
});

campgroundsSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('campground', campgroundsSchema);