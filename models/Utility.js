const mongoose = require("mongoose");
const Joi = require("joi");

const Contact = mongoose.model(
  "Contact",
  new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    message: { type: String },
  })
);
 
const validateContact = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
  message: Joi.string().required(),
});

const Team = mongoose.model(
  "Team",
  new mongoose.Schema({
    name: { type: String },
    email: { type: String },
    contact_number: { type: String },
    skills: { type: String },
    bio: { type: String },
  })
);
 
const validateTeam = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
  contact_number: Joi.string().required(),
  skills: Joi.string().required(),
  message: Joi.string().required(),
});

exports.Contact = Contact;
exports.validateContact = validateContact;
exports.Team = Team;
exports.validateTeam = validateTeam;

 