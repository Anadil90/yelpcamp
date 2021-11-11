const comments = require('../models/comments'),
 campgrounds = require('../models');

// all middleware 
const  middlewareObj = {}

// log in middleware
middlewareObj.isLoggedIn = function (req, res, next){
	
		if(req.isAuthenticated()){
			return next()
		}
			req.flash('error', 'You are not logged in');
			res.redirect('/login');
	}
// log in status middleware
middlewareObj.isAuthorized = function (req, res, next){
	if(req.isAuthenticated()){
		campgrounds.findById(req.params.id, function(err, foundCampground){
		if(err || !foundCampground){
			req.flash('error', 'unable to find campground');
			res.redirect('back');
		}else{
		     if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
				 next();
			 }else{
				 req.flash('error: invalid user privelage. You are not authorised to do that.')
			 }
		}
			
		}); 
	}
}

middlewareObj.authorizedUser = function (req, res, next){
	if(req.isAuthenticated()){
		comments.findById(req.params.id, function(err, foundComment){
		if(err || !foundComment){
			req.flash('error', 'unable to find comment');
			res.render('comments/edit');
		}else{
		     if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
				 next();
			 }else{
				 req.flash('error', 'Cannot modify comment. You are not the author')
				 res.render('comment/edit')
			 }
		}
			
		}); 
	}
}


	

module.exports = middlewareObj