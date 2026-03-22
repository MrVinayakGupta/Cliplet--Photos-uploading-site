const express = require('express');
const router = express.Router();
const userModel = require('./users');
const postModel = require('./posts');
const imageIds = require('../data/images');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(userModel.authenticate()));

const upload = require('./multer');
//handle file upload route
router.post('/upload',isLoggedIn, upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  const user = await userModel.findOne({ username: req.session.passport.user } );
  const postdata =  await postModel.create({
    image: req.file.filename,
    imageText: req.body.filecaption,
    user: user._id
  });

  await user.posts.push(postdata._id);
  res.send('File uploaded successfully.');
});

router.get('/', (req, res) => {
    res.render('home', {  title: 'Pinterest Home' });
});

router.get('/login', (req, res) => {
  console.log(req.flash('error')); // Log the flash message to the console for debugging
    res.render('login', { ids: imageIds, error: req.flash('error') });
});

router.get('/signup', (req, res) => {
    // We pass the 'imageIds' array to the EJS template under the name 'ids'
    res.render('signup', { ids: imageIds });
});

router.get('/profile', isLoggedIn,  async (req, res, next) => {
  const user = await userModel.findOne({ 
    username: req.session.passport.user
   })
    res.render('profile', { title: 'Pinterest Profile', user: user });
});

router.post("/register", (req, res) => {
  const { username, email, fullName, password } = req.body;
  const userData = new userModel({ username, email, fullName });

  userModel.register(userData, password)
    .then(() => {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/profile");
      });
    })
   
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}), (req, res) => {
  res.render("login", { title: "Login" });
});

router.get("/logout", (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}


module.exports = router;