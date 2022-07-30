// const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { ObjectId } = mongoose.Schema.Types;

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: 'User',
    },
    first_name: {
      type: String,
      trim: true,
      required: [true, 'Please enter your first name'],
    },
    last_name: {
      type: String,
      trim: true,
      required: [true, 'Please enter your last name'],
    },
    email: {
      type: String,
      trim: true,
      required: [true, 'Please add an email'],
    },
    phoneNumber: {
      type: String,
      trim: true,
      required: [true, 'Please add a phone number'],
    },
    website: {
      type: String,
      trim: true,
      required: [true, 'Please add a website'],
    },
    address: {
      type: String,
      trim: true,
      required: [true, 'Please add an address'],
    },
    specialization: {
      type: String,
      trim: true,
      required: [true, 'Please add a specialization'],
    },
    experience: {
      type: String,
      trim: true,
      required: [true, 'Please add a experience'],
    },
    feePerConsultation: {
      type: Number,
      required: [true, 'Please add a fee per consultation'],
    },
    timings: {
      type: Array,
      required: [true, 'Please add a timings'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
