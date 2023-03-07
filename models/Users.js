const Joi = require('joi');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, max: 55, trim: true },
  email: {
    type: String,
    required: [true, 'dasdas sda s aa da'],
    lowercase: true,
    max: 55,
    trim: true,
    unique: true,
  },
  id: { type: String }, //FB or google id
  password: { type: String },
  imageUrl: { type: String },
  contact_number: { type: String },
  isGoogleUser: { type: Boolean, required: true },
  isFacebookUser: { type: Boolean, required: true },
  isCustomUser: { type: Boolean, required: true },
  isVerified: { type: Boolean },
  verificationKey: { type: String, max: 5 },
  isWorker: { type: Boolean, default: false },
  workerId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }],
  roles: [], // BASIC, WORKER
  isBlocked: { type: Boolean, default: false },
  forgotPassword: { type: Boolean, default: false },
  recoverypasswordKey: { type: String, max: 5 },
  userRequests: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  ],
  notifications: [
    { type: mongoose.Schema.ObjectId, ref: 'Notification' },
  ],
});

userSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'notifications',
  });
  next();
});

userSchema.pre('save', async function (next) {
  try {
  } catch (err) {
    next(err);
  }
});

userSchema.post('save', async function (next) {
  try {
  } catch (err) {
    next(err);
  }
});

const User = mongoose.model('User', userSchema);

const validateSocialUser = Joi.object({
  name: Joi.string()
    .required()
    .min(3)
    .max(55)
    .label('Name is required and length mest be between 3-55'),
  email: Joi.string()
    .required()
    .lowercase()
    .email()
    .min(3)
    .max(55)
    .label('Email is required and must be valid email.'),
  id: Joi.string().required().label('id is required'),
  imageUrl: Joi.string().required().label('imageUel is required'),
});

const validateCustomUser = Joi.object({
  name: Joi.string().required().min(3).max(55),
  email: Joi.string()
    .required()
    .lowercase()
    .email()
    .min(3)
    .max(55)
    .label('Email is required and must be valid email.'),
  contact_number: Joi.string()
    .required()
    .min(10)
    .max(11)
    .label(
      'contact number is required in format (03306304513) or (0512123123)'
    ),
  password: Joi.string()
    .min(6)
    .max(30)
    .label('password is required and length must be between 6-30'),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .required()
    .lowercase()
    .email()
    .min(3)
    .max(55)
    .label('Email is required and must be valid email.'),
  password: Joi.string()
    .min(6)
    .max(30)
    .label('password is required and length must be between 6-30'),
});

const validateUpdateUser = Joi.object({
  name: Joi.string().required().min(3).max(55),
  contact_number: Joi.string()
    .required()
    .min(10)
    .max(11)
    .label(
      'contact number is required in format (03306304513) or (0512123123)'
    ),
});

exports.User = User;
exports.validateSocialUser = validateSocialUser;
exports.validateCustomUser = validateCustomUser;
exports.validateUpdateUser = validateUpdateUser;
exports.loginSchema = loginSchema;
