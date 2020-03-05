const express = require('express')
const request = require('request')
const config = require('config')
const router = express.Router()
const auth = require('../../middleware/auth')
const { check, validationResult } = require('express-validator')

const Profile = require('../../models/Profile')
const User = require('../../models/User')

// Route Get
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar'])
    if (!profile) {
      return res.status(400).json({ msg: 'there is no profile for this user' })
    }

    res.json(profile)
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Server Error')
  }
})

router.post('/', [auth, [
  check('status', 'Status is required').not().isEmpty(),
  check('skills', 'Skills is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    twitter,
    instagram,
    linkedin
  } = req.body

  const profileFields = {}
  profileFields.user = req.user.id
  if (company) profileFields.company = company
  if (website) profileFields.website = website
  if (location) profileFields.location = location
  if (bio) profileFields.bio = bio
  if (status) profileFields.status = status
  if (githubusername) profileFields.githubusername = githubusername
  if (skills) {
    profileFields.skills = skills.split(',').map(skill => skill.trim())
  }

  profileFields.social = {}
  if (youtube) profileFields.social.youtube = youtube
  if (twitter) profileFields.social.twitter = twitter
  if (facebook) profileFields.social.facebook = facebook
  if (linkedin) profileFields.social.linkedin = linkedin
  if (instagram) profileFields.social.instagram = instagram

  try {
    let profile = await Profile.findOne({ user: req.user.id })

    // update
    if (profile) {
      profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true })

      return res.json(profile)
    }

    // create
    profile = new Profile(profileFields)

    await profile.save()
    res.json(profile)
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server Error')
  }
})

// get all users profile
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar'])
    res.json(profiles)
  } catch (error) {
    console.error()
    res.status(500).send('Server Error')
  }
})

// get profile by ID
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar'])

    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found' })
    }

    res.json(profile)
  } catch (error) {
    console.error()
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' })
    } else {
      res.status(500).send('Server Error')
    }
  }
})

// delete profile
router.delete('/', auth, async (req, res) => {
  try {
    // remove Profile
    await Profile.findOneAndRemove({ user: req.user.id })

    // remove User
    await User.findOneAndRemove({ _id: req.user.id })

    res.json({ msg: 'User Account and Profile Deleted' })
  } catch (error) {
    console.error()
    res.status(500).send('Server Error')
  }
})

// add profile experience
router.put('/experience', [auth, [
  check('title', 'Title is required').not().isEmpty(),
  check('company', 'Company is required').not().isEmpty(),
  check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: errors.array() })
  }

  const {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  } = req.body

  const newExp = {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  }

  try {
    const profile = await Profile.findOne({ user: req.user.id })

    profile.experience.unshift(newExp)

    await profile.save()

    res.json(profile)
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server Error')
  }
})

// delete profile experience
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })

    // Get user experience id
    const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id)

    profile.experience.splice(removeIndex, 1)

    await profile.save()

    res.json(profile)

    console.log('experience deleted')
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server Error')
  }
})

// add profile education
router.put('/education', [auth, [
  check('school', 'School is required').not().isEmpty(),
  check('degree', 'Degree is required').not().isEmpty(),
  check('fieldofstudy', 'Field of Study is required').not().isEmpty(),
  check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: errors.array() })
  }

  const {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  } = req.body

  const newEdu = {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  }

  try {
    const profile = await Profile.findOne({ user: req.user.id })

    profile.education.unshift(newEdu)

    await profile.save()

    res.json(profile)
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server Error')
  }
})

// delete profile education
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })

    // Get user experience id
    const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id)

    profile.education.splice(removeIndex, 1)

    await profile.save()

    res.json(profile)

    console.log('education deleted')
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server Error')
  }
})

// get user repos from github
router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientID')}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' }
    }

    request(options, (error, response, body) => {
      if (error) console.error(error)

      if (response.statusCode !== 200) {
        res.status(404).json({ msg: 'No Github Profile found' })
      }
      res.json(JSON.parse(body))
    })
  } catch (error) {
    console.error()
    res.status(500).send('Server Error')
  }
})

module.exports = router
