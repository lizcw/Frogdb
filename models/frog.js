//Model for Frog CRUD
/* ??maybe
var blogSchema = new Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  body: { type: String, required: true },
  date: { type: String, required: true },
  hidden: Boolean
}, {collection : 'blog'});
*/

//DB CONNECTION - ?SHOULD BE IN CONTROLLER

var nano = require('nano')('http://localhost:5984');
var db = nano.db.use('frogdb');

//LIST
exports.all = function(err,docs){
	
	db.view('ids','byId', {}, function (err, body) {
		var frogs = [];
		if (!err){
			var rows = body.rows;
			for(var i = 0; i < body.rows.length; i++){
				var item = body.rows[i]
				frogs.push(item.value.species);
				console.log('info', 'Species=' + item.value.species);
			}
			err = null;
		}
		else
			console.log('error',err);
		return (err,frogs);
	});
}

