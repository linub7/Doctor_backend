const express = require('express');
const {
  applyDoctor,
  // seenNotification,
  // removeAllNotifications,
  getDoctors,
  updateDoctorState,
} = require('../controllers/doctor');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();
router.post('/doctors/apply', protect, applyDoctor);
// router.put('/doctors/seen-notification', protect, seenNotification);
// router.put(
//   '/doctors/remove-all-notifications',
//   protect,
//   removeAllNotifications
// );

router.get('/doctors', protect, authorize('admin'), getDoctors);
router.put(
  '/doctors/:doctorId',
  protect,
  authorize('admin'),
  updateDoctorState
);

module.exports = router;
