const Joi = require('joi');
const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  u_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  contact_number: { type: String, required: true },
  secondary_contact_number: { type: String, required: true },
  whatsapp_number: { type: String, required: true },
  area: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: true,
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  subCategory_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
  },
  bio: { type: String, required: true, trim: true },
  hourly_rate: { type: String, required: true, trim: true },
  daily_rate: { type: String, required: true, trim: true },
  weekly_rate: { type: String, required: true, trim: true },
  age: { type: String, required: true, trim: true },
  experience: {
    type: String,
    enum: ['6 Month', '1 Year', '2 Years', '3 Years', '3+ Years'],
    required: true,
    trim: true,
  },
  education: {
    type: String,
    enum: ['SSC', 'HSSC', 'BS', 'MS', 'PHD'],
    required: true,
    trim: true,
  },
  skills: [{ type: String, trim: true }],
  picture: { type: String, required: true, trim: true },
  cnic_no: { type: String, required: true, trim: true },
  cnic_pic: { type: String, trim: true },
  is_verified: { type: Boolean, required: true, trim: true },
  is_suspended: { type: Boolean, trim: true },
  is_blocked: { type: Boolean, trim: true },
  rating: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rating' }],
  notifications: [
    { type: mongoose.Schema.ObjectId, ref: 'Notification' },
  ],
});

const Worker = mongoose.model('Worker', workerSchema);

workerSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'notifications',
  });
  next();
});

const validateWorker = Joi.object({
  contact_number: Joi.string()
    .required()
    .min(10)
    .max(11)
    .label(
      'contact number is required in format (03306304513) or (0512123123)'
    ),
  secondary_contact_number: Joi.string()
    .required()
    .min(10)
    .max(11)
    .label(
      'contact number is required in format (03306304513) or (0512123123)'
    ),
  whatsapp_number: Joi.string()
    .required()
    .min(10)
    .max(11)
    .label(
      'contact number is required in format (03306304513) or (0512123123)'
    ),
  area: Joi.string().required(),
  city: Joi.string().required(),
  category_id: Joi.string().required(),
  subCategory_id: Joi.string().required(),
  bio: Joi.string().required(),
  hourly_rate: Joi.string().required(),
  weekly_rate: Joi.string().required(),
  daily_rate: Joi.string().required(),
  age: Joi.string().required(),
  experience: Joi.string().required(),
  education: Joi.string().required(),
  // picture: Joi.string().required(),
  cnic_no: Joi.string().required(),
  // cnic_pic: Joi.string().required(),
});

exports.Worker = Worker;
exports.validateWorker = validateWorker;
