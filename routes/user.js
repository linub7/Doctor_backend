const express = require('express');
const {
  getUsers,
  seenNotification,
  removeAllNotifications,
  getUserSeenNotifications,
  getUserUnseenNotifications,
} = require('../controllers/user');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.put('/users/seen-notification', protect, seenNotification);
router.put('/users/remove-all-notifications', protect, removeAllNotifications);

router.get('/users', protect, authorize('admin'), getUsers);
router.get(
  '/users/seen-notifications-count',
  protect,
  getUserSeenNotifications
);
router.get(
  '/users/unseen-notifications-count',
  protect,
  getUserUnseenNotifications
);

module.exports = router;
