
// packages
var express  = require('express'), 
   mongoose  = require('mongoose'),
   passport  = require('passport'),
flashMessage = require('connect-flash'),


 		localStrategy = require('passport-local'),
passportLocalMongoose = require('passport-local-mongoose'),
       methodOverride = require('method-override');

var app = express();

// import modules  ...................................................>
const campgrounds  = require('./models/index'), 
	   comments  = require('./models/comments'),
           user  = require('./models/user'),
campgroundsRoute = require('./routes/campgrounds'),
	 indexRoute  = require('./routes/index'),
  commentsRoute  = require('./routes/comments');
// // ....................................................................>

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.connect('mongodb://localhost:27017/yelp_camp');
app.set('view engine', 'ejs');
// serve the public directory
app.use(express.static(__dirname + "/public"));
// use body parser
app.use(express.urlencoded({extended:true}));
// use method override
app.use(methodOverride("_method"));
// use connect flash
app.use(flashMessage());
app.locals.moment = require('moment');

// passport setup...................................>
app.use(require('express-session')({
	secret: 'yelp me!',
	resave: false,
	saveUninitialized: false
}));

// inititate passport 
app.use(passport.initialize());
app.use(passport.session());
// set up new passport local strategy
passport.use(new localStrategy(user.authenticate()));
// serialization process 
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());
// ........................................................>

// log in status/flash message middleware
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error   = req.flash('error');
	res.locals.info = req.flash('info');
	res.locals.success = req.flash('success');
	next()
});



app.use('/campgrounds', campgroundsRoute);
app.use(indexRoute);
app.use('/campgrounds/:id/comments/', commentsRoute);

// server config
const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log('yelpcamp server online...')
});