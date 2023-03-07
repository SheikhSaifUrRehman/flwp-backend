const Joi = require("joi");
const mongoose = require("mongoose");


const ratingSchema = new mongoose.Schema({
  rating: { type: Number },
  review: { type: String },
  worker_id: { type: mongoose.Schema.ObjectId, ref: "Worker" },
  user_id: { type: mongoose.Schema.ObjectId, ref: "User" },
});
const Rating = mongoose.model("Rating", ratingSchema);

const validateRating = Joi.object({
  name: Joi.string().required(), 
  review: Joi.string().required(), 
  worker_id: Joi.string().required(),
  user_id: Joi.string().required(),
});
 
exports.Rating = Rating; 
exports.validateRating = validateRating;
 