const express = require('express');
const {
  applyDoctor,
  getDoctor,
  getDoctors,
  getApprovedDoctors,
  updateDoctorState,
  updateAppointmentsState,
  updateDoctorProfile,
  bookAppointment,
  checkBookingAppointmentAvailability,
  getDoctorAppointments,
} = require('../controllers/doctor');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();
router.post('/doctors/apply', protect, applyDoctor);
router.get('/doctors', protect, authorize('admin'), getDoctors);
router.get('/doctors/approved', protect, getApprovedDoctors);
router.put(
  '/doctors/update-profile/:doctorId',
  protect,
  authorize('admin', 'doctor'),
  updateDoctorProfile
);
router.put(
  '/doctors/:doctorId',
  protect,
  authorize('admin'),
  updateDoctorState
);

router.post('/doctors/book-appointment', protect, bookAppointment);
router.post(
  '/doctors/check-booking-appointment-availability',
  protect,
  checkBookingAppointmentAvailability
);

router.get(
  '/doctors/appointments',
  protect,
  authorize('admin', 'doctor'),
  getDoctorAppointments
);

router.put(
  '/doctors/appointments/:appointmentId',
  protect,
  authorize('doctor'),
  updateAppointmentsState
);

router.get(
  '/doctors/:userId',
  protect,
  authorize('admin', 'doctor'),
  getDoctor
);

module.exports = router;
