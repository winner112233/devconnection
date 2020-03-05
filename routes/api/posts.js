const express = require('express')
const router = express.Router()

// Route Get
router.get('/', (req, res) => {
  res.send('Posts Route')
})

module.exports = router
