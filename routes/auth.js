const express = require('express');
const { signup, signin, getMe } = require('../controllers/auth');
const { protect } = require('../middlewares/auth');
const {
  signupValidators,
  signinValidators,
  authValidator,
} = require('../middlewares/authValidator');

const router = express.Router();

router.post('/signup', signupValidators, authValidator, signup);
router.post('/signin', signinValidators, authValidator, signin);
router.get('/auth/me', protect, getMe);

module.exports = router;
