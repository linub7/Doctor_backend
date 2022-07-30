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

exports.seenNotification = asyncHandler(async (req, res, next) => {
  const {
    user: { _id },
  } = req;

  const user = await User.findById(_id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  user.seenNotifications = user.unseenNotifications;

  user.unseenNotifications = [];

  await user.save();

  res.status(200).json({
    message: 'All notifications has been seen',
    seenNotifications: user.seenNotifications,
    unseenNotifications: user.unseenNotifications,
  });
});

exports.removeAllNotifications = asyncHandler(async (req, res, next) => {
  const {
    user: { _id },
  } = req;

  const user = await User.findById(_id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  user.seenNotifications = [];
  user.unseenNotifications = [];

  await user.save();

  res.status(200).json({
    message: 'All notifications has been seen',
  });
});
