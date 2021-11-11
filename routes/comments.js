const express = require('express'),
  campgrounds = require('../models/index'),
	  router  = express.Router({ mergeParams:true }),
    comments  = require('../models/comments'),
  middleware  = require('../middleware');

// NEW.............................................................>
router.get('/new', middleware.isLoggedIn, async (req, res) => {
	await campgrounds.findById(req.params.id, function(err, campground){
		if(err){
			console.log('error matching campground with id');
		}else{
			res.render('comments/new', {campground:campground});
		}
	});
	
});
// .......................................................................>

// POST...............................................................>
router.post('/', async (req, res) => {
	// lookup campground using id 
	await campgrounds.findById(req.params.id, function(err, campground){
		if(err){
			req.flash('error', 'Unable to find campground');
		}else{
			// create new comment 
			comments.create(req.body.comment, function(err, comment){
				if(err){
					console.log('error');
				}else{
					// push new comment to campground 
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					comment.save()
					campground.comments.push(comment);
					campground.save(function(err){
						if(err){
							console.log('error');
						}else{
							// redirect to campgrounds show page
							req.flash('success', 'comment added');
							res.redirect('/campgrounds/' + campground._id);
							
						}
					});
					
					
				}
			});
		}
	})
});

// .............................................................................>

// EDIT..........................................................................................>
router.get('/:comment_id/edit', middleware.isLoggedIn, async (req, res) => {
	    await comments.findById(req.params.comment_id, function(err, foundComment){
		if(err || !foundComment){
			req.flash('error', 'insufficient_userPrivelage - you are not authorized to do that');
			res.redirect('back');
		}else{
			res.render('comments/edit', {campground_id: req.params.id, comment:foundComment});
		}
	})
});
// .....................................................................................................>

// UPDATE..................................................................................................>
router.put('/:comment_id', middleware.isLoggedIn, async (req, res) => {
		await comments.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, foundComment){
			if(err || !foundComment){
				req.flash('error', 'error: unauthorized_user - you cannot do that')
				console.log('unable to post comment')
			return res.redirect('comments/edit')
			}else{
				req.flash('success', 'your comment has been updated');
				res.redirect('/campgrounds/' + req.params.id)
			
			}
				
		});
});
// .............................................................................................................>

// DESTROY.....................................................................> 
router.delete('/:comment_id', middleware.isLoggedIn, async (req, res) => {
	
	await comments.findByIdAndRemove(req.params.comment_id, function(err, comment){
		if(err || !comment){
			req.flash('error', 'unable to remove comment');
			res.redirect('back')
		}else{
			req.flash('success', 'comment deleted!');
			res.redirect('/campgrounds/' + req.params.id);
		}
	});
	
});
// ...................................................................................>

module.exports = router;