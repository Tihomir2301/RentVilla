const express = require('express'); 
const mongoose =  require('mongoose');
const path = require('path'); 
const ejsMate = require('ejs-mate'); 
const methodOverride = require('method-override');
const session = require('express-session');
const Villa = require('./models/villas');
const flash = require('connect-flash');
const Review = require('./models/review');
const catchAsync = require('./errorHandlers/catchAsync');
const ExpressError = require('./errorHandlers/ExpressError');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const { isLoggedIn } = require('./middleware.js');

mongoose.connect('mongodb://localhost:27017/rent-villa');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express(); 


app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))



app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));


const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    console.log(req.session)
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.get('/register', (req, res) => {
    res.render('users/register')

})

app.post('/register', catchAsync(async (req, res, next) => {
    try {
        const { email, username, password } = req.body;

        // Check if the username already exists
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            // Handle the case where the username already exists
            console.log('Username already exists');
            req.flash('error', 'Username already exists.');
            res.redirect('/register'); // Redirect to registration page or handle differently
            return;
        }

        // Check if the email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            // Handle the case where the email already exists
            console.log('Email already exists');
            req.flash('error', 'Email already exists.');
            res.redirect('/register'); // Redirect to registration page or handle differently
            return;
        }

        // If neither username nor email exists, proceed with registration
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to RentVilla!');
            res.redirect('/villas');  
        });
    } catch (e) {
        // Handle other registration errors
        console.error(e);
        req.flash('error', 'Registration failed. Please try again.');
        res.redirect('/register'); // Redirect to registration page or handle differently
    }
}));


app.get('/login', (req, res) =>{
    res.render('users/login')
})
app.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/villas');
    });
}); 

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'welcome back!');
    
    res.redirect('/villas');
})



app.get('/', (req, res) =>{
    res.render('home')

})


app.get('/villas', catchAsync(async (req, res) => {
    const villas = await Villa.find({}); 
    
    res.render('villas/showAll', { villas });
}))

app.get('/villas/new', isLoggedIn,  (req, res) => {
    
    res.render('villas/new');
})

app.post('/villas', isLoggedIn, catchAsync(async (req, res) => {
    
    const villa = new Villa(req.body.villa);
    villa.author = req.user._id;
    await villa.save();
    res.redirect(`/villas/${villa._id}`)
}))




app.get('/villas/:id', isLoggedIn, catchAsync(async (req, res) => {
    const villa = await Villa.findById(req.params.id).populate('reviews').populate('author');
    res.render('villas/details', { villa });
}))


app.get('/villas/:id/edit', isLoggedIn, catchAsync(async (req, res) => {
    const villa = await Villa.findById(req.params.id)
    res.render('villas/edit', { villa });
}))

app.put('/villas/:id', isLoggedIn,  catchAsync(async (req, res) => {
    const { id } = req.params;
    const villa = await Villa.findByIdAndUpdate(id, { ...req.body.villa });
    res.redirect(`/villas/${villa._id}`)
}));

app.delete('/villas/:id', isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params;
    await Villa.findByIdAndDelete(id);
    res.redirect('/villas');
}));

app.post('/villas/:id/reviews',isLoggedIn, catchAsync(async (req, res) => {
    const villa = await Villa.findById(req.params.id);
    const review = new Review(req.body.review);
    villa.reviews.push(review);
    await review.save();
    await villa.save();
    res.redirect(`/villas/${villa._id}`);
}));

app.delete('/villas/:id/reviews/:reviewId',isLoggedIn, catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Villa.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/villas/${id}`);
}));

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})


app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('errorPage', { err })
})

app.listen(3000, () => {
    console.log('Listening on port 3000')
})
