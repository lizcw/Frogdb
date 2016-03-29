var express = require('express')
  , router = express.Router()
 // , Frog = require('../models/frogModel')

var nano = require('nano')('http://localhost:5984');
var db = nano.db.use('frogdb');
var cdbmodel = require('couchdb-model');
var model = cdbmodel(db);
var MAXOPS = 6; //GLOBAL set in a config somewhere?
//async
var async = require("async");
//var map = require("async/map");
//Date format function

//CREATE
router.get('/create/:fid', function(req,res,next){
		//Check Frog ID is valid
		model.findOneByID(req.params.fid,function(error,result){
			if (!error){
				var frogid = req.params.fid;
				db.view('operations','byFrogId',{key: frogid}, function(error,result){
						if (!error)
							//Check next number for operation - if more than 6 then deny
							var opnum = 0;
							if (result && result.length > 0)
								opnum = result.length; 
							console.log('Frog has operations=' + opnum);
							if (opnum < MAXOPS){
								opnum++;
								res.render('operationcreate',{"frogid": frogid, "opnum": opnum});
							} else {
								error="Maximum operations for this frog";
								console.error(error);
								//throws error;
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
					res.redirect('/operations/' + req.body.frogid);
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
						res.redirect('/operations' + req.body.frogid);
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
						var item = rows[i];
						console.log("Item=" + item.value);
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
//Operations report list
function opsummary(frog_id, opdate, nextop,opnum, callback){
	model.findOneByID(frog_id, function(error, frog) {
		if (error) return callback(error);
		var summary = {
						frog_id: frog_id,
						frognum: frog.frogid,
						num_ops: opnum,
						last_op: opdate,
						next_op: nextop,
						condition: frog.condition,
						general: frog.comments,
						tankid: frog.tankid
					};
		console.log('Summary=' + summary.frognum);
		callback(null, summary);
		//callback = summary;
		});

}
//frogid,num_operations,last_op,nextop,condition,remarks,tankid
router.get('/', function(req,res){
	var summaries = [];
	var selectedrows = [];
	async.series([
		//Load operations data
		function(callback) {
			loadOperations(function(err,rows){
				if (err) return callback(err);
				selectedrows = rows;
				console.log("DEBUG: CALLBACK: loadOperations: selectedrows=" + selectedrows.length);
				callback();
			}, callback);
			
		},
		function(callback) {
			console.log("DEBUG: callback: selectedrows=" + selectedrows.length);
			async.forEach(selectedrows, function(row, callback){
				console.log('lookup=' + row.frog_id);
				model.findOneByID(row.frog_id, function(error, frog) {
					if (error) return callback(error);
					console.log("Frog found=" + frog._id);
					var summary = {
						frog_id: frog._id,
						frognum: frog.frogid,
						num_ops: row.num_ops,
						last_op: row.last_op,
						next_op: row.next_op,
						condition: frog.condition,
						general: frog.comments,
						tankid: frog.tankid
					};
					summaries.push(summary);
					console.log('Summary pushed=' + summary.frognum);
					callback();
				});
				
			}, callback);
		}
	], function(err, results){
		//if (err) return next(err);
		//console.error(err);
		//console.log("RESULTS: " + results);
		var msg = "Operations listed=" + summaries.length;
		console.log("FINAL: " + msg);
        res.render('operationssummary', {"summaries": summaries, "message" : msg });
	});
});
					
function loadOperations(callback){	
	    var selectedrows = [];		
		db.view('operations','bySummary',{descending:true},function(err, result){
				if (err) return callback(err);
				if (result.rows){
					console.log("rows=" + result.rows.length);
					//select only latest op per row
					
					var today = new Date();
					var trackops = {};
					for (var i=0; i < result.rows.length; i++){
						var frog_id= result.rows[i].value.frogid;
						var lastop =result.rows[i].value.operation_date;
						var opnum=result.rows[i].value.operation_num;
						//console.log('Operations Summary: frogid=' + frog_id);
						var nextop='';
						if (!trackops[frog_id] || (trackops[frog_id] && opnum > trackops[frog_id])){
							console.log('Loading op summary for=' + frog_id);
							trackops[frog_id] = opnum;
							var d2 = new Date(lastop);
							console.log('DEBUG: d2=' + d2.getTime());
							nextop = new Date(d2.getTime() + (6*30*24*60*60*1000)); //add six months
							console.log('DEBUG: 6mths+d2=' + nextop.getTime());
							console.log('DEBUG: date=' + nextop.getDate());
							console.log('DEBUG: today=' + today.getTime());
							if (nextop.getTime() <= today.getTime())
								nextop = 'OK';
							else{
								var mm = nextop.getMonth() + 1;
								var dd = nextop.getDate();
								if (mm < 10)
									mm = "0" + mm;
								if (dd < 10)
									dd = "0" + dd;
								nextop = nextop.getFullYear() + "-" +  mm.toString() + "-" + dd.toString();
							}
							console.log('DEBUG: nextop=' + nextop);
							
							var summary = {
								frog_id: frog_id,
								//frognum: frog.frogid,
								num_ops: opnum,
								last_op: lastop,
								next_op: nextop,
								//condition: frog.condition,
								//general: frog.comments,
								//tankid: frog.tankid
							};
							//opsummary(frog_id,lastop,nextop,opnum, function(err, summary));
							selectedrows.push(summary);
						}
					} //end for loop
					console.log("DEBUG: FN:loadOperations: selectedrows=" + selectedrows.length);
				}
				//return selectedrows;
				callback(null, selectedrows);
			
			});

}
module.exports = router