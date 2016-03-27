var express = require('express')
  , router = express.Router()
 // , Frog = require('../models/frogModel')

var nano = require('nano')('http://localhost:5984');
var db = nano.db.use('frogdb');
var cdbmodel = require('couchdb-model');
var model = cdbmodel(db);
var MAXOPS = 6; //GLOBAL set in a config somewhere?
//CREATE
router.get('/create/:fid', function(req,res,next){
		//Check Frog ID is valid
		model.findOneByID(req.params.fid,function(error,result){
			if (!error){
				var frogid = req.params.fid;
				db.view('operations','byFrogId',{key: frogid}, function(error,result){
						if (!error)
							//Check next number for operation - if more than 6 then deny
							var opnum = result.length; 
							console.log('Frog has operations=' + opnum);
							if (opnum < MAXOPS){
								opnum++;
								res.render('operationcreate',{"frogid": frogid, "opnum": opnum});
							} else {
								error="Maximum operations for this frog";
								console.error(error);
								throw error;
							}
			});
			}
		});
});
//save new operation details
router.post('/create', function(req,res){
				
	var operation = model.create({
				operation_num: req.body.opnum,
				operation_date: req.body.opdate,
				anesthetic: req.body.anesthetic,
				volume: req.body.volume,
				comments: req.body.comments,
				initials: req.body.initials,
				frogid: req.body.frogid,
				modeltype: 'operation'
		});
	
		console.log(operation);
		
		operation.save(function(error){
			if(!error){
				console.log('operation created with id: ' + operation._id);
				//redirect to image upload
				//res.redirect('/operations/view/' + operation._id);
				res.redirect('/operations/' + operation.frogid);
			} else {
				console.error('operation create failed: ' + error);
			}
		});
		
});
//VIEW
router.get('/view/:id', function(req,res,next) {
	console.log('View operation id=' + req.params.id);
	model.findOneByID(req.params.id, function(error, result) {
		if (error) 
			console.error('Failed to get the document');
		else 
			console.log(result); // result is an model instance
			res.render('operationview', {"operation": result});
		});
});
//EDIT
router.get('/edit/:id', function(req, res, next) {
	console.log('Getting operation id=' + req.params.id);
	//Find operation
	model.findOneByID(req.params.id, function(error, result) {
		if (error) 
			console.error('failed to get the document');
		else 
			console.log(result); // result is an model instance
			res.render('operationedit', {"operation": result});
		});
});
//callback
router.post('/update', function(req,res){
		console.log('Updating operation id=' + req.body.id);
		model.findOneByID(req.body.id, function(error, result) {
			var revid = result._rev;
			console.log(result);
			var operation = {
				_rev: revid,
				_id: req.body.id,
				modeltype: 'operation',
				operation_num: req.body.opnum,
				operation_date: req.body.opdate,
				anesthetic: req.body.anesthetic,
				volume: req.body.volume,
				comments: req.body.comments,
				initials: req.body.initials,
				frogid: req.body.frogid
			};
			
			db.insert(operation, function(error) {
				if (error) console.error('failed to save document');
				else 
					console.log('document saved with id: ' + operation._id);
					res.redirect('/operations');
			});
		});
});

//DELETE
//TODO: Add popup confirm
//TODO: REfresh list URL
router.get('/delete/:id', function(req,res){
		console.log('Call to delete operationid');
		model.findOneByID(req.params.id, function(error, result) {
				if (!error){
					console.log('Deleting operation id: ' + result._id);
					result.delete(function(error) {
						if (error) console.error('Failed to delete id');
						else console.log(' deleted');
						res.redirect('/operations');
					});
				}
		});
});

//Index list
router.get('/:fid', function(req,res,next){
	db.view('operations','byFrogId', {key: req.params.fid}, function (err, body){
		console.log('info',body);
		if (!err){
			var operations = [];
			if (body.total_rows > 0){
				var rows = body.rows;
				for(var i = 0; i < rows.length; i++){
						var item = rows[i]
						operations.push(item.value);
				}
				console.log('info', 'Num operations=' + operations.length);
				err = "Total operations: " + operations.length + " of 6";
			} else {
				err="No operations entered";
			}
			model.findOneByID(req.params.fid, function(error, result) {
				if (!error){
					console.log('Operations: frogid=' + result.frogid);
					res.render('operationstable', {"operations": operations, "frog": result, "message" : err });
				}
			});
		//return (err,operations);
		}
	});
});
module.exports = router