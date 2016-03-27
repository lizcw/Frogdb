var express = require('express')
  , router = express.Router()
  , Frog = require('../models/frog')

router.use('/frogs', require('./frogs'))

router.get('/', function(req, res) {
  Frog.create(function(err, frogs) {
    res.render('index', {frogs: frogs})
  })
})

module.exports = router