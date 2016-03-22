//Model for Frog CRUD
var model = require('nodejs-model');

//BASE
var Frog = model("Frog")
.attr('modeltype',{
		tags:['private'],
		validations:{
			presence: true
		}
})
.attr('idprefix',{
		tags:['private']
})
.attr('frogid',{
		validations:{
			presence:{
				message: 'Frog ID is required'
			},
			uniqueUserName: {
                message: 'FrogID already exists'
            }
        
		}
})
.attr('species',{
	validations: {
		presence:{
			message: 'Species is required'
		},
		length: {
			minimum: 2,
			maximum: 200,
			messages: {
				tooShort: 'Species name is too short',
				tooLong: 'Species name is too long'
			}
		}
	}
})
.attr('tankid',{
	validations: {
		length: {
			minimum: 1,
			maximum: 3,
			allowBlank: true,
			messages: {
				tooShort: 'Min Tankid is 1 digit',
				tooLong: 'Max tankid is 3 digits'
			}
		}
	}
})
.attr('qen',{
	validations: {
		length: {
			minimum: 2,
			maximum: 10,
			messages: {
				tooShort: 'QEN is too short',
				tooLong: 'QEN is too long'
			}
		},
		format: { 
			with: /^[A-Za-z0-9]*$/, 
			allowBlank: true, 
			message: 'Invalid format (characters and digits only)'  }
	}
})
.attr('gender',{
		validations: {
			presence:{
				message: 'Gender is required'
			},
			format: {
				with: /[male|female]/,
				message: 'Invalid format (male or female)'
			}
		}
})
.attr('aec',{
		validations: {
			format: {
				with: /^[A-Za-z0-9\\/]*$/,
				allowBlank: true,
				message: 'Invalid format (chars, digits, slashes)'
			}
		}
})
.attr('location',{
		validations: {
			format: {
				with: /^[A-Za-z0-9\s]*$/,
				allowBlank: true,
				message: 'Invalid format'
			}
		}
})
.attr('condition',{
		validations: {
			format: {
				with: /^[A-Za-z0-9\s]*$/,
				allowBlank: true,
				message: 'Invalid format'
			}
		}
})
.attr('comments',{
		validations: {
			format: {
				with: /^[A-Za-z0-9\s]*$/,
				allowBlank: true,
				message: 'Invalid format'
			}
		}
})
;

//TODO:Write validator ?using https://www.npmjs.com/package/validator
//replace validations with function isXXX


Frog.modeltype('frog');
