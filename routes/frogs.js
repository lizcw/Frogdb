var express = require('express')
  , router = express.Router()
 // , Frog = require('../models/frogModel')

var nano = require('nano')('http://localhost:5984');
var db = nano.db.use('frogdb');
var cdbmodel = require('couchdb-model');
var fs = require('fs');
var http = require('http');
var Q = require('q');
var multer  = require('multer');
var upload = multer({ dest: './uploads/' }); //upload files
/*set views
https://github.com/sevcsik/node-couchdb-model
*/
var model = cdbmodel(db);
//Test upload
var uploading = multer({
  dest: './uploads1/',
  limits: {fileSize: 1000000, files:2},
})

//Find by _id
//Access to images??
/*
var dorsalimage = 'undefined';
			db.attachment.get(result._id, 'dorsalimage', function(err, body) {
				  if (!err) {
					dorsalimage = body;
				  }
				});
				*/
router.get('/edit/:id', function(req, res, next) {
	console.log('Getting frog id=' + req.params.id);
	//Find frog
	model.findOneByID(req.params.id, function(error, result) {
		if (error) 
			console.error('failed to get the document');
		else 
			console.log(result); // result is an model instance
			
			db.view('droplists','qens',{'group':true},function(err,body){
				var qenlist = [];
				if (!err){
					console.log('Body=',body);
					for(var i = 0; i < body.rows.length; i++){
						var item = body.rows[i]
						qenlist.push(item.key);
					}
					console.log('Qenlist=',qenlist);
					res.render('frogedit', {"frog": result, "qenlist" : qenlist});
				}
			});

	});

});
router.get('/view/:id', function(req,res,next) {
	console.log('View frog id=' + req.params.id);
	model.findOneByID(req.params.id, function(error, result) {
		if (error) 
			console.error('Failed to get the document');
		else 
			console.log(result); // result is an model instance
			res.render('frogview', {"frog": result});
		});
});

//Delete Frog
//TODO: Add popup confirm
//TODO: REfresh list URL
router.get('/delete/:id', function(req,res){
		console.log('Call to delete frogid');
		model.findOneByID(req.params.id, function(error, result) {
				if (!error){
					console.log('Deleting frogid: ' + result.frogid);
					result.delete(function(error) {
						if (error) console.error('Failed to delete Frog  id');
						else console.log('Frog deleted');
						res.redirect('/frogs/');
					});
				}
		});
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
							res.redirect('/frogs');
						});
				}
			} 
		});
});
//Update existing frog details with images
router.post('/update', cpUpload, function(req,res){
		console.log('Updating frog id=' + req.body.id);
		model.findOneByID(req.body.id, function(error, result) {
			var revid = result._rev;
			console.log('rev=' + revid);
			//console.log(result);
			var frog = {
					_id: req.body.id,
					_rev: revid,
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
							res.redirect('/frogs');
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
				}else{
					db.attachment.get(frog._id, 'dorsalimage', function(err, body) {
					  if (!err) {
						attachments.push(body);
					  }
					});
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
				}else{
					db.attachment.get(frog._id, 'ventralimage', function(err, body) {
					  if (!err) {
						attachments.push(body);
					  }
					});
				}
				
				db.multipart.insert(frog, attachments, frog._id,  function(err){
				  if (err)
					console.log('Update failed: ' + err);
				  else
					console.log('Update succeeded');
					res.redirect('/frogs');
				});
			}
			
		});
});

//New frog details
router.get('/create', function(req,res){
	db.view('droplists','qens',{'group':true},function(err,body){
			var qenlist = [];
			if (!err){
				//console.log('Body=',body);
				for(var i = 0; i < body.rows.length; i++){
					var item = body.rows[i]
					qenlist.push(item.key);
				}
				console.log('Qenlist=',qenlist);
				res.render('frogcreate', {"qenlist" : qenlist})
			}
		});
});
//save new frog details
router.post('/create', function(req,res){
				
	var frog = model.create({
				frogid: req.body.frogid,
				tankid: req.body.tankid,
				qen: req.body.qen,
				gender: req.body.gender,
				species: req.body.species,
				aec: req.body.aec,
				location: req.body.location,
				condition: req.body.condition,
				comments: req.body.comments
		});
	
		console.log(frog);
		
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


//Index froglist
router.get('/', function(req,res){
	
	//Need to move this to model/frog.js but not returning value
      db.view('ids','byFrogid', {}, function (err, body) {
		var frogs = [];
		if (!err){
			var rows = body.rows;
			for(var i = 0; i < body.rows.length; i++){
				var item = body.rows[i]
				frogs.push(item.value);
				console.log('info', 'Species=' + item.value.species);
			}
			err = null
			res.render('frogstable', {"frogs": frogs });
		}
		else
			console.log('error',err);
		return (err,frogs);
	});

});
module.exports = router