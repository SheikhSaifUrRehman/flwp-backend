const Joi = require("joi");
const mongoose = require("mongoose");

const Admin = mongoose.model(
  "Admin",
  new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String },
    role: { type: Number },
  }) 
);   

const validateAdmin = Joi.object({
  name: Joi.string().required(),
  password: Joi.string().required(),
  email: Joi.string()
    .required()
    .lowercase()
    .email()
    .min(3)
    .max(55)
    .label("Email is required and must be valid email."),
});


const loginSchema = Joi.object({
  email: Joi.string()
    .required()
    .lowercase()
    .email()
    .min(3)
    .max(55)
    .label("Email is required and must be valid email."),
  password: Joi.string()
    .min(6)
    .max(30)
    .label("password is required and length must be between 6-30"),
});



exports.Admin = Admin;
exports.validateAdmin = validateAdmin;
exports.loginSchema = loginSchema;
