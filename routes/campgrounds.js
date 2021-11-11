var express = require('express'),
   mongoose = require('mongoose'),
campgrounds = require('../models/index'),
   comments = require('../models/comments'),
	   path = require('path'),
     router = express.Router(),
middleware = require('../middleware');

// INDEX - show all campgrounds
router.get('/', (req, res) => {
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
			campgrounds.find({name: regex}, function(err, campground){	
			if(err || campground.length < 1){
				req.flash('error', 'The campground you are looking for does not exist');
				res.redirect('/campgrounds');
			}else{	
				res.render('campgrounds/index', {campgrounds:campground});
			}	
		});
	}else{
		campgrounds.find({}, function(err, campgrounds){
			if(err){
				req.flash('error', 'Error loading campgrounds');
			}else{
				res.render('campgrounds/index', {campgrounds:campgrounds});
			}
		});
	}	
});

// CREATE - add new campground to DB
router.post('/', middleware.isLoggedIn, (req, res) => {
	// insert data into campgrounds database
	// redirect to campgrounds page
	const name = req.body.name,
	     image = req.body.imageUrl,
   description = req.body.desc;
	
	const author = {
		id: req.user._id,
		username: req.user.username
	}
		
	const newCampgrounds = {name:name, image:image, description:description, author:author};
	
	campgrounds.create(newCampgrounds, (err, created) => {
		if(err || !created){
			req.flash('error', 'unable to add campground');
		}else{
			req.flash('success', 'campground created!');	
		}
		res.redirect('/campgrounds');
	});
	
});

// NEW - show form to create new campground
router.get('/new', middleware.isLoggedIn, (req, res) => {
	res.render('campgrounds/new');
});

// SHOW - show more information about a campground
router.get('/:id', middleware.isLoggedIn, (req, res) => {
	// find the campground with the ID provided
	campgrounds.findById(req.params.id).populate('comments').exec(function(err, id_matched){
		if(err){
			req.flash('error', 'There was an error finding the campground');
		}else{
			// render the show template with that campground
			res.render('campgrounds/show', {campground:id_matched});
		}
	});
	
});

// EDIT
router.get('/:id/edit', middleware.isAuthorized, (req, res) => {
	campgrounds.findById(req.params.id, function(err, foundCampground){
		if(err || !foundCampground){
			req.flash('The campground you are trying to edit does bot exist!');
			res.redirect('back');
		}else{
			res.render('campgrounds/edit', {campground:foundCampground})
		}
	});
});

// UPDATE
// find the correct campground and update
router.put('/:id', middleware.isAuthorized, (req, res) => {
	
	campgrounds.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updated){
		
		if(err){
			req.flash('error', 'there was an error updating the campground');
		}else{
			// redirect to campgrounds page
			req.flash('success', 'campground updated!');
			res.redirect('/campgrounds/' + req.params.id);
		}
	})
});

// DESTROY

router.delete('/:id', middleware.isAuthorized, (req, res) => {
	campgrounds.findByIdAndRemove(req.params.id, function(err){
		if(err){
			console.log('error removing campgrounds');
		}else{
			req.flash('success', 'campground deleted!');
			res.redirect('/campgrounds');
		}
	});
});

function escapeRegex(text){
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
};

module.exports = router;