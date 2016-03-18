var express = require('express');
var router = express.Router();
//SHOULD IMPLEMENT AUTH0
//https://auth0.com/docs/server-platforms/nodejs
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('To the Login form');
});

/* process the form */
router.post(function(req,res){
	console.log('processing login:' + req);
	res.send('Processing login for ');
});

module.exports = router;