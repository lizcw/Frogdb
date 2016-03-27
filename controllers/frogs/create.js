var express = require('express')
  , router = express.Router()
  , Frog = require('../models/frog')
  , auth = require('../middleware/auth')

router.post('/', auth, function(req, res) {
  user = req.user.id
  text = req.body.text

  Frog.create(user, text, function (err, comment) {
    res.redirect('/')
  })
})

router.get('/:id', function(req, res) {
  Frog.get(req.params.id, function (err, frog) {
    res.render('frogs/frog', {frog: frog})
  })
})

module.exports = router