const express = require('express');
const router = express.Router();
const userModel = require('./users');
const postModel = require('./posts');
const imageIds = require('../data/images');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(userModel.authenticate()));

router.get('/', (req, res) => {
    res.render('home', {  title: 'Pinterest Home' });
});

router.get('/login', (req, res) => {
    res.render('login', { ids: imageIds });
});

router.get('/signup', (req, res) => {
    // We pass the 'imageIds' array to the EJS template under the name 'ids'
    res.render('signup', { ids: imageIds });
});

router.get('/profile', isLoggedIn, (req, res, next) => {
    res.render('profile', { title: 'Pinterest Profile' });
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