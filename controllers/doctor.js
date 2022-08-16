const asyncHandler = require('../middlewares/async');
const ErrorResponse = require('../utils/errorResponse');
const Doctor = require('../models/doctor');
const User = require('../models/user');
const Appointment = require('../models/appointment');
const { getMinuteHour } = require('../utils/getAvailableMinuteHour');
const moment = require('moment');

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

exports.getApprovedDoctors = asyncHandler(async (req, res, next) => {
  const doctors = await Doctor.find({ status: 'approved' });

  res.status(200).json({
    doctors,
  });
});

exports.getDoctor = asyncHandler(async (req, res, next) => {
  const {
    params: { userId },
  } = req;

  const doctor = await Doctor.findOne({ user: userId }).populate(
    'user',
    'role'
  );

  if (!doctor) {
    return next(new ErrorResponse('Doctor not found', 404));
  }

  res.status(200).json({
    doctor,
  });
});

exports.getDoctorAppointments = asyncHandler(async (req, res, next) => {
  const {
    user: { _id },
  } = req;

  console.log(_id);
  const doctor = await Doctor.findOne({ user: _id });

  if (!doctor) {
    return next(new ErrorResponse('Doctor not found', 404));
  }

  const appointments = await Appointment.find({ doctor: doctor._id }).populate(
    'user',
    'name email'
  );

  return res.status(200).json({
    appointments,
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

exports.updateAppointmentsState = asyncHandler(async (req, res, next) => {
  const {
    params: { appointmentId },
    user: { _id },
    body: { status },
  } = req;

  if (!status) {
    return next(new ErrorResponse('Status is required', 400));
  }

  const doctor = await Doctor.findOne({ user: _id });

  if (!doctor) {
    return next(new ErrorResponse('Doctor not found', 404));
  }

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    doctor: doctor._id,
  });

  if (!appointment) {
    return next(new ErrorResponse('Appointment not found', 404));
  }

  if (appointment.doctor.toString() !== doctor._id.toString()) {
    return next(
      new ErrorResponse(
        'You are not authorized to update this appointment',
        401
      )
    );
  }

  appointment.status = status;

  const user = await User.findById(appointment.user);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const conditionalType =
    status === 'confirmed'
      ? 'new-appointment-confirmed'
      : 'new-appointment-cancelled';

  const conditionalMessage = `Your Appointment Request has been ${status}`;

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

  const admin = await User.findOne({ role: 'admin' });

  const adminUnseenNotifications = admin.unseenNotifications;
  const adminConditionalMessage = `Mr/Mrs ${doctor.last_name} has been ${status} Mr/Mrs ${user.name} Request for an appointment`;

  const newAdminUnseenNotification = {
    type: conditionalType,
    message: adminConditionalMessage,
    data: {
      doctorId: doctor._id,
      doctorName: `${doctor.first_name} ${doctor.last_name}`,
      userId: user._id,
      user: `${user.first_name} ${user.last_name}`,
    },
    path: '/admin/doctors',
  };
  adminUnseenNotifications.push(newAdminUnseenNotification);

  await doctor.save();
  await user.save();
  await appointment.save();
  await admin.save();

  res.status(200).json({
    message: 'Appointment state has been updated',
    appointment,
  });
});

exports.updateDoctorProfile = asyncHandler(async (req, res, next) => {
  const {
    params: { doctorId },
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
    user,
  } = req;

  const doctor = await Doctor.findById(doctorId);
  const relatedUser = await User.findOne({ _id: doctor.user });

  console.log(doctor.user.toString() === relatedUser._id.toString());
  console.log(user);

  if (!doctor) {
    return next(new ErrorResponse('Doctor not found', 404));
  }

  if (doctor.user.toString() !== relatedUser._id.toString()) {
    return next(new ErrorResponse('Unauthorized', 401));
  }

  doctor.first_name = first_name ? first_name : doctor.first_name;
  doctor.last_name = last_name ? last_name : doctor.last_name;
  doctor.email = email ? email : doctor.email;
  doctor.phoneNumber = phoneNumber ? phoneNumber : doctor.phoneNumber;
  doctor.website = website ? website : doctor.website;
  doctor.address = address ? address : doctor.address;
  doctor.specialization = specialization
    ? specialization
    : doctor.specialization;
  doctor.experience = experience ? experience : doctor.experience;
  doctor.feePerConsultation = feePerConsultation
    ? feePerConsultation
    : doctor.feePerConsultation;
  doctor.timings = timings ? timings : doctor.timings;

  await doctor.save();

  res.status(200).json({
    message: 'Doctor profile has been updated',
    doctor,
  });
});

exports.bookAppointment = asyncHandler(async (req, res, next) => {
  let {
    body: { doctor, user, date, time },
  } = req;

  const existDoctor = await Doctor.findById(doctor._id);

  const relatedDoctorUserAccount = await User.findOne({
    _id: existDoctor.user,
  });

  const possibleDoctorTimings = existDoctor.timings;
  const startTime = getMinuteHour(possibleDoctorTimings[0]);

  const endTime = getMinuteHour(possibleDoctorTimings[1]);

  const inputTime = getMinuteHour(time);

  console.log(parseInt(startTime.hour));
  console.log(parseInt(endTime.hour));
  console.log(parseInt(inputTime.hour));

  if (
    parseInt(inputTime.hour) < parseInt(startTime.hour) ||
    parseInt(inputTime.hour) > parseInt(endTime.hour)
  ) {
    return next(
      new ErrorResponse(
        `Invalid time - Please select a time between ${startTime.hour} and ${endTime.hour}`,
        400
      )
    );
  }

  if (!existDoctor) {
    return next(new ErrorResponse('Doctor not found', 404));
  }

  if (!relatedDoctorUserAccount) {
    return next(new ErrorResponse('Doctor user not found', 404));
  }

  const existUser = await User.findById(user._id);
  console.log('existUser', existUser);

  if (!existUser) {
    return next(new ErrorResponse('User not found', 404));
  }

  date = moment(date, 'DD-MM-YYYY').toISOString();
  time = moment(time, 'HH:mm').toISOString();

  const newAppointment = await Appointment.create({
    doctor: doctor._id,
    user: user._id,
    date,
    time,
  });

  relatedDoctorUserAccount.unseenNotifications.push({
    type: 'new-appointment',
    message: `Mr/Mrs ${existUser.name} has booked an appointment. Please check your appointments`,
    data: {
      appointmentId: newAppointment._id,
      appointmentDate: date,
      appointmentTime: time,
      appointmentDoctor: `Mr/Mrs ${existDoctor.first_name} ${existDoctor.last_name}`,
      appointmentUser: `Mr/Mrs ${existUser.name}`,
    },
    path: `/doctor/appointments`,
  });
  await relatedDoctorUserAccount.save();

  res.status(201).json({
    message: 'Appointment has been booked successfully',
    appointment: newAppointment,
  });
});

exports.checkBookingAppointmentAvailability = asyncHandler(
  async (req, res, next) => {
    const {
      body: { doctor, date, time },
    } = req;
    const isoDate = moment(date, 'DD-MM-YYYY').toISOString();
    const fromTime = moment(time, 'HH:mm')
      .subtract(60, 'minutes')
      .toISOString();
    const toTime = moment(time, 'HH:mm').add(60, 'minutes').toISOString();

    console.log(isoDate);
    console.log(fromTime);
    console.log(toTime);

    const appointments = await Appointment.find({
      doctor: doctor._id,
      date: isoDate,
      time: { $gte: fromTime, $lte: toTime },
      status: 'confirmed',
    });

    console.log(appointments);

    if (appointments.length > 0) {
      return next(
        new ErrorResponse(
          `Appointment already booked for this time. Please select another time`,
          400
        )
      );
    }

    res.status(200).json({
      message: 'Appointment is available',
      success: true,
    });
  }
);
