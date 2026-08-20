require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const expressSession = require('express-session');
const flash = require('connect-flash');
const ejs = require("ejs");
const ejsMate = require("ejs-mate");


var indexRouter = require('./routes/index');
var usersRouter = require('./models/users');
const passport = require("passport");

var app = express();

// view engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
app.use(flash());


// Session setup
const session = require("express-session");
app.use(session({
  secret: "yourSecretKey",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport-local-mongoose provides these methods:
passport.serializeUser(usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());

app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());

// Global middleware for views (makes currUser and flash messages accessible in all EJS templates)
app.use((req, res, next) => {
  res.locals.currUser = req.user || null;
  res.locals.currentUser = req.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
module.exports = app;