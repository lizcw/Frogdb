var express = require('express');
var router = express.Router();

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Home' });
});

/* GET about page. */
router.get('/about', function(req, res) {
  res.render('about', { title: 'About Us'});
});

/* GET search page. 
router.param('searchterm', function(req,res,next,name){
		//do validation here
		console.log("Validated: " + searchterm);
		//if ok set request param and continue
		req.searchterm = searchterm;
		next();
});
		
router.get('/search/:searchterm', function(req, res) {
  res.send('Search for ' + searchterm);
});

/* GET landing page. *
router.get('/frogs', function(req, res, next) {
  res.render('frogs', { title: 'Frogs' });
});
*/
module.exports = router;
