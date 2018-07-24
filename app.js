var createError = require('http-errors');
var express = require('express');
var logger = require('morgan');
const cors = require('cors')
var indexRouter = require('./api/index');
// var usersRouter = require('./api/users');

require('dotenv').config()
require('./api/models/db')
const whitelist = ['http://localhost:3000']
let corsOptions = {
   origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1) {
         callback(null, true)
      } else {
         callback(new Error('Not allowed by CORS'))
      }
   }
}

var app = express();

app.use("*", cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', indexRouter);
// app.use('/users', usersRouter);

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

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
