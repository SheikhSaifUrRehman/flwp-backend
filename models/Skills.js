const Joi = require("joi");
const mongoose = require("mongoose");

const skillsSchema = new mongoose.Schema({
  name: { type: String },
});

const Skills = mongoose.model("Skills", skillsSchema);

const validateSkills = Joi.object({
  name: Joi.string().required(),
});

exports.Skills = Skills;
exports.validateSkills = validateSkills;
 