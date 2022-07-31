const asyncHandler = require('../middlewares/async');
const User = require('../models/user');
const ErrorResponse = require('../utils/errorResponse');

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

exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find();

  const filteredUsers = users.filter((user) => user.role !== 'admin');

  res.status(200).json({
    users: filteredUsers,
  });
});

exports.getUserUnseenNotifications = asyncHandler(async (req, res, next) => {
  const {
    user: { _id },
  } = req;

  const user = await User.findById(_id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    unseenNotifications: user.unseenNotifications,
  });
});

exports.getUserSeenNotifications = asyncHandler(async (req, res, next) => {
  const {
    user: { _id },
  } = req;

  const user = await User.findById(_id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    seenNotifications: user.seenNotifications,
  });
});
