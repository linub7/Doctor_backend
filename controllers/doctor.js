const asyncHandler = require('../middlewares/async');
const ErrorResponse = require('../utils/errorResponse');
const Doctor = require('../models/doctor');
const User = require('../models/user');

exports.applyDoctor = asyncHandler(async (req, res, next) => {
  const {
    user: { _id },
    body: {
      first_name,
      last_name,
      email,
      phoneNumber,
      website,
      address,
      specialization,
      experience,
      feePerConsultation,
      timings,
    },
  } = req;

  const user = await User.findById(_id);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  if (user?.role === 'doctor') {
    return next(new ErrorResponse('You are doctor!', 400));
  }

  const existingDoctor = await Doctor.findOne({ user: _id });
  if (existingDoctor) {
    return next(
      new ErrorResponse('You have already applied for a doctor', 400)
    );
  }

  const newDoctor = await Doctor.create({
    user: _id,
    first_name,
    last_name,
    email,
    phoneNumber,
    website,
    address,
    specialization,
    experience,
    feePerConsultation,
    timings,
  });
  const admin = await User.findOne({ role: 'admin' });

  const adminUnseenNotifications = admin.unseenNotifications;

  const newAdminUnseenNotification = {
    type: 'new-doctor-applied',
    message: `Mr/Mrs ${newDoctor.last_name} has applied for a doctor`,
    data: {
      doctorId: newDoctor._id,
      doctorName: `${newDoctor.first_name} ${newDoctor.last_name}`,
    },
    path: '/admin/doctors',
  };
  adminUnseenNotifications.push(newAdminUnseenNotification);

  await admin.save();

  res.status(201).json({
    message:
      'Apply request has been sent successfully. Please wait for admin approval.',
  });
});

exports.getDoctors = asyncHandler(async (req, res, next) => {
  const doctors = await Doctor.find();

  res.status(200).json({
    doctors,
  });
});

exports.updateDoctorState = asyncHandler(async (req, res, next) => {
  const {
    params: { doctorId },
    body: { status },
  } = req;

  if (!status) {
    return next(new ErrorResponse('Status is required', 400));
  }

  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    return next(new ErrorResponse('Doctor not found', 404));
  }

  doctor.status = status;

  const user = await User.findById(doctor.user);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const conditionalType =
    status === 'approved' ? 'new-doctor-approved' : 'new-doctor-rejected';

  const conditionalMessage = `Your Apply Request has been ${status}`;

  const newUnseenNotification = {
    type: conditionalType,
    message: conditionalMessage,
    data: {
      doctorId: doctor._id,
      doctorName: `${doctor.first_name} ${doctor.last_name}`,
    },
    path: null,
  };

  user.unseenNotifications.push(newUnseenNotification);

  if (status === 'approved') {
    user.role = 'doctor';
  }

  const admin = await User.findOne({ role: 'admin' });

  const adminUnseenNotifications = admin.unseenNotifications;
  const adminConditionalMessage = `Mr/Mrs ${doctor.last_name} has been ${status}`;

  const newAdminUnseenNotification = {
    type: conditionalType,
    message: adminConditionalMessage,
    data: {
      doctorId: doctor._id,
      doctorName: `${doctor.first_name} ${doctor.last_name}`,
    },
    path: '/admin/doctors',
  };
  adminUnseenNotifications.push(newAdminUnseenNotification);

  await doctor.save();
  await user.save();
  await admin.save();

  res.status(200).json({
    message: 'Doctor state has been updated',
    doctor,
  });
});
