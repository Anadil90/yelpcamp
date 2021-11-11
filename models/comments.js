var mongoose = require('mongoose');
// SCHEMA
var commentSchema = new mongoose.Schema({
	text: String,
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user'
		},
		username: String
	},
	createdAt: {type: Date, default: Date.now}
});

module.exports = new mongoose.model('comment', commentSchema);