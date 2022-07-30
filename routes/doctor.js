const express = require('express');
const {
  applyDoctor,
  seenNotification,
  removeAllNotifications,
} = require('../controllers/doctor');
const { protect } = require('../middlewares/auth');

const router = express.Router();
router.post('/doctors/apply', protect, applyDoctor);
router.put('/doctors/seen-notification', protect, seenNotification);
router.put(
  '/doctors/remove-all-notifications',
  protect,
  removeAllNotifications
);

module.exports = router;
