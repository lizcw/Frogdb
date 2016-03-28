var express = require('express')
  , router = express.Router()
//  , Frog = require('../models/frogModel')
var nano = require('nano')('http://localhost:5984');
var db = nano.db.use('frogdb');
var cdbmodel = require('couchdb-model');
var model = cdbmodel(db);

/*//Specify update function
db.update = function(obj, key, callback){
 var db = this;
 db.get(key, function (error, existing){ 
    if(!error) obj._rev = existing._rev;
    db.insert(obj, key, callback);
 });
}
*/
var fs = require('fs');
var http = require('http');
//var Q = require('q');
var async = require("async");
//var paginate = require('couchdb-paginate');
//upload files
var multer  = require('multer');
var upload = multer({ 
		dest: './uploads/',
		limits: {fileSize: 1000000, files:2 }
}); 


router.get('/edit/:id', function(req, res, next) {
	console.log('Edit frog id=' + req.params.id);
	//Find frog
	model.findOneByID(req.params.id, function(error, result) {
		if (error) 
			console.error('Find by ID failed:' + error);
		else 
			console.log(result); // result is an model instance
			
			db.view('droplists','qens',{'group':true},function(err,body){
				var qenlist = [];
				if (!err){
					//console.log('Body=',body);
					for(var i = 0; i < body.rows.length; i++){
						var item = body.rows[i]
						qenlist.push(item.key);
					}
					console.log('Qenlist=',qenlist);
					res.render('frogedit', {
						"frog": result, 
						"qenlist" : qenlist});
				}
			});

	});

});
router.get('/view/:id', function(req,res,next) {
	console.log('View frog id=' + req.params.id);
	model.findOneByID(req.params.id, function(error, result) {
		if (error) 
			console.error('Find by ID failed:' + error);
		else 
			console.log(result); // result is an model instance
			res.render('frogview', {
				"frog": result});
		});
});

//Delete Frog
//TODO: Add popup confirm
//TODO: REfresh list URL
router.get('/delete/:id', function(req,res,next){
		console.log('Call to delete frogid');
		model.findOneByID(req.params.id, function(error, result) {
			if (!error){
					console.log('Deleting frogid: ' + result.frogid);
					result.delete(function(error) {
						if (error) console.error('Failed to delete Frog  id');
						else console.log('Frog deleted');
						
					});
				}
		});	
		res.redirect('/frogs');
});
//TEMPORARY TO CLEAN UP AUTO-GENERATED FROGS - perhaps admin only?
router.get('/bulkauto/delete', function(req,res,next){
		var mylist = [];
		db.view('ids','byAutoFrog',{},function(err,body){
			if (!err){
				//console.log('Body=',body);
				for(var i = 0; i < body.rows.length; i++){
					var item = body.rows[i]
					mylist.push(item.key);
					model.findOneByID(item.key, function(error, result) {
						if (!error){
								console.log('Deleting frogid: ' + result.frogid);
								result.delete(function(error) {
									if (error) console.error('Failed to delete Frog  id');
									else console.log('Frog deleted');
								});
						}
					});
				}
			}
			
		});
		res.redirect('/frogs');
});
		
		
//Update frog details
var cpUpload = upload.fields([{ name: 'dorsalimage', maxCount: 1 }, { name: 'ventralimage', maxCount: 1 }]);
/* router.post('/upload', uploading.single('image'), function(req, res,next) {
		if (req.file){ //NB file not files! with single fn
			console.log("Mini Files uploaded: " + req.file);
			var myfile = req.file;
			console.log('Filename=' + myfile.filename);
			console.log('Original=' + myfile.originalname);
			console.log('Path=' + myfile.path);
			console.log('Type=' + myfile.mimetype);
			console.log('Size=' + myfile.size);
		}else{
			console.log("Mini No files uploaded");
		}
}); */
//Add new images to frog
router.get('/frogupload/:id', function(req,res){
		model.findOneByID(req.params.id, function(error, result) {
			if (error) 
				console.error('failed to get the document');
			else 
				console.log(result); // result is an model instance
				res.render('frogupload', {"frog": result});
		});
});
//Upload images to new frog
router.post('/upload', cpUpload, function(req,res){
		var id = req.body.id;
		console.log('Upload images to id=' + id)
		model.findOneByID(id, function(error, result) {
			if (error) {
				console.error('failed to get the document');
			} else {
				var frog = {
					_id: result._id,
					_rev: result._rev,
					modeltype: 'frog',
					frogid: result.frogid,
					tankid: result.tankid,
					qen: result.qen,
					gender: result.gender,
					species: result.species,
					aec: result.aec,
					location: result.location,
					condition: result.condition,
					comments: result.comments
				};
				//If has shipment id
				if (result.shipment)
					frog.shipment= result.shipment;
				if (req.files){
					var attachments = [];
						if (req.files['dorsalimage']){
							var myfile1 = req.files['dorsalimage'][0];
							console.log('Dorsal Image file: ' + myfile1.path);
							var attach1 = {
								name: 'dorsalimage',
								data: fs.readFileSync(myfile1.path),
								content_type: myfile1.mimetype
							};
							attachments.push(attach1);
						}
						if (req.files['ventralimage']){
							var myfile2 = req.files['ventralimage'][0];
							console.log('Ventral Image file: ' + myfile2.path);
							var attach2 = {
								name: 'ventralimage',
								data: fs.readFileSync(myfile2.path),
								content_type: myfile2.mimetype
							};
							attachments.push(attach2);
						}
						//?Need to see if existing attachments?
						db.multipart.insert(frog, attachments, id,  function(err){
						  if (err)
							console.log('Upload failed: ' + err);
						  else
							console.log('Upload succeeded');
							res.redirect('/frogs/view/' + id);
						});
				}
			} 
		});
});
//Update existing frog details with images
//@db.updateWithHandler("my_design_doc", "in-place", "<doc_name>", 
//  { field: "foo", value: "bar" }, function(e,b) { console.log(b); }); 
router.post('/update', cpUpload, function(req,res){
		console.log('Updating frog id=' + req.body.id);
		model.findOneByID(req.body.id, function(error, result) {
			var revid = result._rev;
			console.log('rev=' + revid);
			//console.log(result);
			var frog = {
					_id: req.body.id,
					_rev: revid,
					modeltype: 'frog',
					frogid: req.body.frogid,
					tankid: req.body.tankid,
					qen: req.body.qen,
					gender: req.body.gender,
					species: req.body.species,
					aec: req.body.aec,
					location: req.body.location,
					condition: req.body.condition,
					comments: req.body.comments
			};
			//If has shipment id
			if (result.shipment)
				frog.shipment= result.shipment;
			if (result._attachments){
				console.log('attachments=' + result._attachments);
				frog._attachments = result._attachments;
			}
				
			console.log(frog);
			console.log(req.files);
			if (typeof req.files == 'undefined'){
				console.log('No files uploaded');
				//Save other data
				if (req.body){
					frogmodel = model.create(frog);
					frogmodel.save(function(error){
						if(!error){
							console.log('frog updated with id: ' + frog._id);
							res.redirect('/frogs/view/'+ frog._id);
						} else {
							console.error('frog update failed: ' + error);
						}
					});
				}
			
			} else {
				var attachments = [];
				//Preserve any previous images
				if (req.files['dorsalimage']){
					var myfile1 = req.files['dorsalimage'][0];
					console.log('Dorsal Image file: ' + myfile1.path);
					var attach1 = {
						name: 'dorsalimage',
						data: fs.readFileSync(myfile1.path),
						content_type: myfile1.mimetype
					};
					attachments.push(attach1);
				}
				if (req.files['ventralimage']){
					var myfile2 = req.files['ventralimage'][0];
					console.log('Ventral Image file: ' + myfile2.path);
					var attach2 = {
						name: 'ventralimage',
						data: fs.readFileSync(myfile2.path),
						content_type: myfile2.mimetype
					};
					attachments.push(attach2);
				}
				
				db.multipart.insert(frog, attachments, frog._id,  function(err){
				  if (err)
					console.log('Update failed: ' + err);
				  else
					console.log('Update succeeded');
					res.redirect('/frogs/view/'+ frog._id);
				});
			}
			
		});
});

function getQens(req,res,next){
	console.log('QENS list');
	return function(cb){
		var qenlist =[];
		db.view('droplists','qens',{'group':true},function(err,body){
			
			if (!err){
				
				for(var i = 0; i < body.rows.length; i++){
					var item = body.rows[i]
					qenlist.push(item.key);
				}
				console.log('Qenlist=',qenlist);
				req.qenlist = qenlist;
				return next();
				//return qenlist;
			}
		});
	}
}
	

//New frog details
router.get('/create', function(req,res){
	async.parallel({
		qenlist: getQens()
	  },
	  function(result) {
	  	  res.render('frogcreate', {"qenlist" : result.qenlist});
    	});
	
});
//save new frog details
router.post('/create', function(req,res){
		var frog = model.create({
				frogid: req.body.frogid,
				modeltype: 'frog',
				tankid: req.body.tankid,
				qen: req.body.qen,
				gender: req.body.gender,
				species: req.body.species,
				aec: req.body.aec,
				location: req.body.location,
				condition: req.body.condition,
				comments: req.body.comments
		}); 
		//TODO NEED TO VALIDATE
		frog.save(function(error){
			if(!error){
				console.log('frog created with id: ' + frog._id);
				//redirect to image upload
				res.redirect('/frogs/frogupload/' + frog._id);
			} else {
				console.error('frog create failed: ' + error);
			}
		});
});

/* function getfrogsByShipment(req,res,next){
	
}
function paginatefrogs(req,res){
} */

	
//Get frogs by shipment (not all have shipmentid)
router.get('/byShipment/:shipmentid/:start/:prev', function(req,res){
		var shipmentid = req.params.shipmentid;
		console.log('View frogs by shipment:' , shipmentid);
		var start= req.params.start;
		var prev = req.params.prev;
		var limit = 10;
		var params={};
		//NB Has to match view key [shipment, frogid, id]
		if (prev <= 0){
			params = {startkey: [shipmentid,0,start], limit: limit};
		}else {
			params = {endkey: [shipmentid,0,start], limit: limit}
		}
		db.view('ids','byShipment',params, function(err, body){
			var frogs = [];
			var paginate ={};
			if (!err && body.total_rows > 0){
				
				//TODO REPLACE WITH CALLBACK
				var rows = body.rows;
				var total = body.total_rows * 1;
				var offset = body.offset * 1;
				var end = rows.length - 1;
				var nexthref = rows[end].id;
				var totalpages = Math.ceil(total/limit).toString();
				var page = Math.ceil(offset/limit) + 1;
				var hasprev = (page > 1);
				var hasnext = (page < totalpages);
				if (!hasnext) end = rows.length; //reset to full set at end of series
				for(var i = 0; i < end; i++){
					var item = rows[i];
					frogs.push(item.value);
					console.log('Loading Species=' + item.value.species);
				}
				paginate ={
					hrefPrev: '/frogs/byShipment/' + shipmentid + '/' + start + '/1',
					hrefNext: '/frogs/byShipment/' + shipmentid + '/' + nexthref + '/0',
					hasPrevious: hasprev,
					hasNext: hasnext,
					page: page,
					totalpages: totalpages
				};
				db.view('shipments','byArrivaldate', {id: shipmentid}, function(err, body){
						if (!err){
							var adate = new Date(body.rows[0].value.arrivaldate);
							res.render('frogstable', {
								"frogs": frogs,
								"paginate":paginate,
								"message": 'From shipment on ' + adate
							});
						}
				});
				return(err,frogs);
				
			} else {
				return(getQenslist,newFrog);
			}
		});
});
//Index froglist with pagination using couchdb-paginate - nOT WORKING
/*router.get('/:start', paginate({
	couchURI: 'http://localhost:5984',
	database: 'frogdb',
	design: 'ids',
	view: 'paginateFrogs'}),function (req, res, next){
		var totalrecs = req.documents.length;
		console.log("total:", totalrecs);
		


//Get frogs by shipment (not all have shipmentid)
router.get('/byShipment/:shipmentid/:start/:prev', function(req,res,next){
		var shipmentid = req.params.shipmentid;
		console.log('View frogs by shipment:' , shipmentid);
		var start= req.params.start;
		var prev = req.params.prev;
		var limit = 10;
		var params={};
		//NB Has to match view key [shipment, frogid, id]
		if (prev <= 0){
			params = {startkey: [shipmentid,0,start], limit: limit};
		}else {
			params = {endkey: [shipmentid,0,start], limit: limit}
		}
		db.view('ids','byShipment',params, function(err, body){
			var frogs = [];
			if (!err){
				
				//TODO REPLACE WITH CALLBACK
				var rows = body.rows;
				var total = body.total_rows * 1;
				var offset = body.offset * 1;
				var end = rows.length - 1;
				var nexthref = rows[end].id;
				var totalpages = Math.ceil(total/limit).toString();
				var page = Math.ceil(offset/limit) + 1;
				var hasprev = (page > 1);
				var hasnext = (page < totalpages);
				if (!hasnext) end = rows.length; //reset to full set at end of series
				for(var i = 0; i < end; i++){
					var item = rows[i];
					frogs.push(item.value);
					console.log('Loading Species=' + item.value.species);
				}
				var paginate ={
					hrefPrev: '/frogs/byShipment/' + shipmentid + '/' + start + '/1',
					hrefNext: '/frogs/byShipment/' + shipmentid + '/' + nexthref + '/0',
					hasPrevious: hasprev,
					hasNext: hasnext,
					page: page,
					totalpages: totalpages
				};
				res.render('frogstable', {
					"frogs": frogs,
					"paginate":paginate
				});
				
			}
		});
});
//Index froglist with pagination using couchdb-paginate - nOT WORKING
/*router.get('/:start', paginate({
	couchURI: 'http://localhost:5984',
	database: 'frogdb',
	design: 'ids',
	view: 'paginateFrogs'}),function (req, res, next){
		var totalrecs = req.documents.length;
		console.log("total:", totalrecs);
		


});
*/
//Index froglist
//format: frogs/<firstid>/0 (no previous)
// frogs/<secondid>/1 (previous page)

router.get('/:start/:prev', function (req, res){
	var start= req.params.start;
	var prev = req.params.prev;
	var limit = 10; //GLOBAL CONFIG
	var params={};
	if (prev <= 0){
		params = {startkey: start, limit: limit};
	}else {
		params = {endkey: start, limit: limit}
	}
	var frogs = [];
	//Get list of frogs
	db.view('ids','paginateFrogs', params, function (err, body) {
		console.log("Total=" + body.total_rows);
		if (!err && body.total_rows > 0){

			var rows = body.rows;
			var total = body.total_rows * 1;
			console.log("totalrows=" + total);
			var offset = body.offset * 1;
			console.log("offset=" + offset);
			
			var end = rows.length - 1;
			console.log("end=" + end);
			var nexthref = rows[end].id;
			
			var totalpages = Math.ceil(total/limit).toString();
			var page = Math.ceil(offset/limit) + 1;
			var hasprev = (page > 1);
			//if (hasprev) prev = 1;
			var hasnext = (page < totalpages);
			if (!hasnext) end = rows.length; //reset to full set at end of series
			for(var i = 0; i < end; i++){
				var item = rows[i];
				frogs.push(item.value);
				console.log('Loading Species=' + item.value.species);
			}
			var paginate ={
				hrefPrev: '/frogs/' + start + '/1',
				hrefNext: '/frogs/' + nexthref + '/0',
				hasPrevious: hasprev,
				hasNext: hasnext,
				page: page,
				totalpages: totalpages
			};
			console.log('Page='+ paginate.page);
			console.log('Totalpages='+ paginate.totalpages);
			console.log('hasPrevious='+ paginate.hasPrevious);
			console.log('hasNext='+ paginate.hasNext);
			console.log('hrefPrev='+ paginate.hrefPrev);
			console.log('hrefNext='+ paginate.hrefNext);
			res.render('frogstable', {
				"frogs": frogs,
				"paginate":paginate
			});
			return (err,frogs);
		} else {
			console.log('No data - redirect to create Frog');
			return(getQenslist,newFrog);
		}
		
	});

});

module.exports = router