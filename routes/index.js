var express = require('express');
var router = express.Router();
var nano = require('nano')('http://localhost:5984');
var db = nano.db.use('frogdb');
// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});
/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('Home page');
  db.view('ids','countfrogs', {}, function(err,result){
  	 if (!err){
  	 	 var numfrogs = 0;
  	 	 if(result.rows && result.rows[0].value > 0){
  	 	 	 numfrogs = result.rows[0].value;
  	 	 }
  	 	 console.log("DB has records= " + numfrogs);
  	 	 res.render('index', { title: 'QBI Frog DB', numfrogs: numfrogs });
  	 }
  });
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
