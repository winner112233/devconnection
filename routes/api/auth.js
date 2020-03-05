const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const jwt = require('jsonwebtoken')
const config = require('config')
const bcrypt = require('bcryptjs')
const { check, validationResult } = require('express-validator')

const User = require('../../models/User')

// Route Get
router.get('/', auth, async (req, res) => {
  try {
    console.log('req.user', req.user)
    const user = await User.findById(req.user.id).select('-password')
    res.json(user)
  } catch (error) {
    console.log('error', error)
    res.status(500).send('Server Error')
  }
})

router.post('/', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'password is required').exists()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, password } = req.body

  try {
    const user = await User.findOne({ email })

    if (!user) {
      res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] })
    }

    const payload = {
      user: {
        id: user.id
      }
    }

    jwt.sign(payload, config.get('jwtSecret'),
      { expiresIn: 36000 },
      (err, token) => {
        if (err) throw err
        res.json({ token })
      })
  } catch (err) {
    console.log(err.message)
    res.status(500).send('Server Error')
  }
})

module.exports = router
