var express = require('express')
  , router = express.Router()
 // , Frog = require('../models/frogModel')

var nano = require('nano')('http://localhost:5984');
var db = nano.db.use('frogdb');
var cdbmodel = require('couchdb-model');
var model = cdbmodel(db);

//CREATE
router.get('/create', function(req,res){
	res.render('shipmentcreate');
});
//save new shipment details
router.post('/create', function(req,res){
				
	var shipment = model.create({
				aqis: req.body.aqis,
				qen: req.body.qen,
				females: req.body.females,
				males: req.body.males,
				arrivaldate: req.body.arrivaldate,
				species: req.body.species,
				supplier: req.body.supplier,
				country: req.body.country,
				modeltype: 'shipment'
		});
	
		console.log(shipment);
		
		shipment.save(function(error){
			if(!error){
				console.log('shipment created with id: ' + shipment._id);
				//redirect to image upload
				res.redirect('/shipments/view/' + shipment._id);
			} else {
				console.error('shipment create failed: ' + error);
			}
		});
		
});
//VIEW
router.get('/view/:id', function(req,res,next) {
	console.log('View shipment id=' + req.params.id);
	model.findOneByID(req.params.id, function(error, result) {
		if (error) 
			console.error('Failed to get the document');
		else 
			console.log(result); // result is an model instance
			res.render('shipmentview', {"shipment": result});
		});
});
//EDIT
router.get('/edit/:id', function(req, res, next) {
	console.log('Getting shipment id=' + req.params.id);
	//Find shipment
	model.findOneByID(req.params.id, function(error, result) {
		if (error) 
			console.error('failed to get the document');
		else 
			console.log(result); // result is an model instance
			res.render('shipmentedit', {"shipment": result});
		});
});
//callback
router.post('/update', function(req,res){
		console.log('Updating shipment id=' + req.body.id);
		model.findOneByID(req.body.id, function(error, result) {
			var revid = result._rev;
			console.log(result);
			var shipment = {
				_rev: revid,
				_id: req.body.id,
				modeltype: 'shipment',
				aqis: req.body.aqis,
				qen: req.body.qen,
				females: req.body.females,
				males: req.body.males,
				arrivaldate: req.body.arrivaldate,
				species: req.body.species,
				supplier: req.body.supplier,
				country: req.body.country
			};
			
			db.insert(shipment, function(error) {
				if (error) console.error('failed to save document');
				else 
					console.log('document saved with id: ' + shipment._id);
					res.redirect('/shipments');
			});
		});
});

//DELETE
//TODO: Add popup confirm
//TODO: REfresh list URL
router.get('/delete/:id', function(req,res){
		console.log('Call to delete shipmentid');
		model.findOneByID(req.params.id, function(error, result) {
				if (!error){
					console.log('Deleting shipment id: ' + result._id);
					result.delete(function(error) {
						if (error) console.error('Failed to delete id');
						else console.log(' deleted');
						res.redirect('/shipments');
					});
				}
		});
});
//GENERATE Frogs from shipment record - ?BULK method required
router.get('/generate/:id', function(req,res){
		console.log('Generating new frog records from shipment='+ req.params.id);
		model.findOneByID(req.params.id, function(error, result) {
			if (!error){
				for(var i=0; i< result.females + result.males; i++){
					var gender='male'
					if (i < result.females)
						gender='female';
					var frog = model.create({
						frogid: 0,
						modeltype: 'frog',
						tankid: 0,
						qen: result.qen,
						gender: gender,
						species: result.species,
						aec: '',
						location: '',
						condition: '',
						comments: ''
					});
					console.log(frog);
					frog.save(function(error){
						if(!error){
							console.log('Frog created with id: '+ frog._id);
						}else{
							console.error('Unable to create frog:' + error);
						}
					});
				}
				
			}
		});
});
//Index list
router.get('/', function(req,res){
	db.view('shipments','ByArrivaldate', {}, function (err, body){
		console.log('info',body);
		var shipments = [];
		if (!err){
			if (body.total_rows > 0){
				var rows = body.rows;
				for(var i = 0; i < rows.length; i++){
					var item = rows[i]
					shipments.push(item.value);
				}
				console.log('info', 'Loading AQIS=' + item.value.aqis);
				console.log('info', 'Num shipments=' + shipments.length);
				err = "Total shipments=" + shipments.length;
			} else {
				err="No shipments entered";
			}
			res.render('shipmentstable', {"shipments": shipments, "message" : err });
			
		} else{
			console.log('error',err);
		}
		return (err,shipments);
	});
});
module.exports = router