// Let's make our express `Router` first.
var express = require('express')
var router = express.Router();
router.get('/error', function(req, res, next) {
  // here we cause an error in the pipeline so we see express-winston in action.
  return next(new Error("This is an error and it should be logged to the console"));
});

