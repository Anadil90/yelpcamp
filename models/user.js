var mongoose = require('mongoose'),
passportLocalMongoose = require('passport-local-mongoose');



// Schema
var userSchema = new mongoose.Schema({
	username: {type: String, unique: true, required: true},
	password: String,
	  coverImg: String,
	  profileImg: String,
   firstName: String,
    lastName: String,
	   email: {type: String, unique: true, required: true},
resetPasswordToken: String,
resetTokenExpires: Date,
		 bio: String,
    isAdmin : {type: Boolean, default: false}
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('user', userSchema);