var express = require('express');
var app = express();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressHbs = require('express-handlebars');
var mongoose = require('mongoose');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var validator = require('express-validator');
var MongoStore = require('connect-mongo')(session);

var routes = require('./routes/index');
var userRoutes = require('./routes/user')

require('./config/passport');

mongoose.Promise = global.Promise;
mongoose.connect('localhost:27017/shopping');

// view engine setup
app.engine('.hbs', expressHbs({defaultLayout: 'layout', extname: '.hbs'}))
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(session({
  secret: 'secretSessionKey',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  cookie: { maxAge: 180 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('bower_components'));

// Variables globales
app.use(function(req, res, next){
  // esto es true o false dependiendo de si estás logeado o no.
  res.locals.login = req.isAuthenticated();

  // header show name if is registered or just user
  if(res.locals.login){
    res.locals.user = req.user.email;
  } else {
    res.locals.user = 'User';
  }

  if(res.locals.login){
    if(req.user.role === "admin"){
      res.locals.role = req.user.role === "admin";
    }
  }

  res.locals.session = req.session;
  next();
})

app.use('/user', userRoutes);
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
