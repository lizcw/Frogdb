//Model for Frog CRUD
var nano = require('nano')('http://localhost:5984');
var db = nano.db.use('frogdb');
var cdbmodel = require('couchdb-model');
var model = cdbmodel(db);

//BASE
var Frog = model.create({
		data: 'my_data',
		created: Date.now()
});




