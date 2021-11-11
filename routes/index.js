const  express = require('express'),
	passport = require('passport'),
localStrategy = require('passport-local'),
passportLocalMongoose = require('passport-local-mongoose'),
		User = require('../models/user'),
 campgrounds = require('../models/index'),
    comments = require('../models/comments'), 
	  crypto = require('crypto'),
	   Async = require('async'),
      path = require('path'),
nodemailer = require('nodemailer'),
    router = express.Router();	 


	require('dotenv').config();

// LANDING
router.get('/', (req, res) => {
	res.render('landing');
});

// AUTH ROUTES...............................................................>

// LOGIN
// show login form
router.get('/login', (req, res) => {
	res.render('login');
});

// passport login middleware
router.post('/login', passport.authenticate('local', {
	successRedirect: '/campgrounds',
	failureRedirect: '/login'
}), function(req, res){
	
});

// REGISTER
// show register form
router.get('/register', (req, res) => {
	res.render('register');
});


// handle user registration logic
router.post('/register', (req, res) => {
  const username = req.body.username,
	   firstName = req.body.firstName,
	    lastName = req.body.lastName,
		  avatar = req.body.avatar,
		   email = req.body.email,
		     bio = req.body.bio;

	const newUser = new User({
		 username: username, 
		firstName: firstName, 
		 lastName: lastName, 
		   avatar: avatar,
		    email: email,
		      bio: bio
	});
	
	if(req.body.adminCode === 'isAdmin123'){
		newUser.isAdmin = true;
	}
// create new user in DB 
	
	User.register(newUser, req.body.password, (err, user) => {
		if(err){
			req.flash('error', 'Unable to create user');
			return res.redirect('/register');
		}
		// log in new user
		passport.authenticate('local')(req, res, function(){
			req.flash('success', 'Registration successful. Welcome to Yelpcamp ' + user.username )
			res.redirect('/campgrounds');
		});
	});
});

// LOGOUT

router.get('/logout', (req, res) => {
	req.logout();
	req.flash('info', 'You have been logged out');
	res.redirect('/campgrounds');
});
// ................................................................>

// USER PROFILE..............................................>

// SHOW
// find user and pass user object to template
router.get('/users/:id', (req, res) => {
	
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			res.redirect('/campgrounds');
		}else{
			res.render('users/show', {user: foundUser});
		}
	});

});

// EDIT
// find user, render form, and pass user object to template
router.get('/users/:id/edit', (req, res) => {
	User.findById(req.params.id, function(err, userFound){
		if(err){
			req.flash('error', 'user was not found');
			res.redirect('/users/' + req.params.id);
		}else{
			res.render('users/edit', {user: userFound});
		}
	});
	
});

// UPDATE
// find user and update profile
router.put('/users/:id', (req, res) => {
	User.findByIdAndUpdate(req.params.id, req.body.profile, function(err, updated){
		if(err){
			req.flash('error', 'unable to find user');
			res.redirect('/users/' + req.params.id + '/edit');
		}else{
			req.flash('success', 'user profile updated!');
			res.redirect('/users/' + req.params.id);
			
		}
	});
});

// DESTROY
// find user and destroy profile
router.delete('/users/:id', (req, res) => {
	
	User.findByIdAndRemove(req.params.id, function(err){
		if(err){
			req.flash('error', 'unable to remove profile');
			res.redirect('/back');
		}else{
			req.flash('success', 'profile deleted! You will no longer be able to create campgrounds or comment');
			res.redirect('/campgrounds');
		}
	})	
});
// ........................................................................>

// PASSWORD RESET FORM....................................................>
router.get('/reset_password', function(req, res){
	
	res.render('reset');
});
// ...............................................................................>

// RESET PASSWORD TOKEN GENERATION.......................................................> 	
router.post('/reset_password', function(req, res, next){
	Async.waterfall([
		function(done){
			crypto.randomBytes(20, function(err, buf){
				const token = buf.toString('hex');
				done(err, token);
			});
		},
		function(token, done){
			User.findOne({email: req.body.email}, function(err, user){
				if(err || !user){
					req.flash('error', 'User account with this email does not exist!');
					return res.redirect('/reset_password');
				}
				
					user.resetPasswordToken = token;
					user.resetTokenExpires = Date.now() + 3600000//ms = 1 hour
					const Token = user.resetTokenExpires
					user.save(function(err){
					done(err, token, user);

				});
			});
		},
		function(token, user, done){
			var smtpTransport = nodemailer.createTransport({
				service: 'Yandex',
				auth: {
					user: 'yelpcamp-app@yandex.com',
					pass: process.env.usr
				}
			});
			var mailOptions = {
				to: user.email,
				from: 'yelpcamp-app@yandex.com',
				subject: 'Yelpcamp password reset',
				text: 'You are receiving this email because you have requested to reset your password for this site.' + ' Please click the following link or paste this into your browser to complete the process.' + '\n' + 'http://' + req.headers.host + '/change_password/' + token + '\n\n' + 'If you did not request this change, you may ignore this email, and the password will remain unchanged.'
			};
			
			smtpTransport.sendMail(mailOptions, function(err){
				req.flash('success', 'An email has been sent to ' + user.email + ' with further instructions.');
				done(err, 'done');
				console.log('mail successfully sent');
			});
		}
		
	], function(err){
		if(err) return next(err);
		res.redirect('/reset_password');
	});
});
// ..................................................................................................................>

// CHANGE PASSWORD FORM.............................................................................................>
router.get('/change_password/:token', async function(req, res){
	await User.findOne({ resetPasswordToken: req.params.token }).or([ { resetTokenExpires: {$gt: Date.now()}}])

    .then(user => {
		res.render('users/password-change', {token: req.params.token});
	})

    .catch(error => {res.redirect('/reset_password') })

});
// ..................................................................................................................>

// UPDATE PASSWORD...................................................................................................................>
router.post('/change_password/:token', function(req, res){
	Async.waterfall([
			  function(done) {
				// find user and check if password reset token is valid 
				User.findOne({resetPasswordToken: req.params.token,  resetTokenExpires: {$gte: Date.now()}}, function(err, user) {
				  if (!user) {
					req.flash('error', 'Password reset token is invalid or has expired.');
					return res.redirect('back');
				  }
				  if(req.body.password === req.body.confirm) {
					//  set new user password
					 user.setPassword(req.body.password, function(err) {
					  user.resetPasswordToken = undefined;
					  user.resetTokenExpires = undefined;
					//   save password to user DB 
					  user.save(function(err) {
						req.logIn(user, function(err) {
						  done(err, user);
						});
					  });
					})
				  } else {
					  req.flash("error", "Passwords do not match.");
					  return res.redirect('back');
				  }
				});
			  },
			//   send success notification to user's email 
			  function(user, done) {
				var smtpTransport = nodemailer.createTransport({
				  service: 'Yandex', 
				  auth: {
					user: 'yelpcamp-app@yandex.com',
					pass: process.env.usr
				  }
				});
				var mailOptions = {
				  to: user.email,
				  from: 'yelpcamp-app@yandex.com',
				  subject: 'Your password has been changed',
				  text: 'Hello,\n\n' +
					'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
				};
				smtpTransport.sendMail(mailOptions, function(err) {
				  req.flash('success', 'Success! Your password has been changed.');
				  done(err);
				});
			  }
			//    redirect to page 
			], function(err) {
			  res.redirect('/campgrounds');
			});
});
// ........................................................................................................................................>


module.exports = router;
