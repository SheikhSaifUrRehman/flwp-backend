const mongoose = require("mongoose");
const Joi = require("joi");

const UserRequest = mongoose.model(
  "UserRequest",
  new mongoose.Schema({
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    info: {
      type: String,
      required: true,
      trim: true,
      min: 3,
      max: 500,
    },
    proposedTimeLength: {
      type: String,
      trim: true
    },
    skills: {
      type: String,
      trim: true
    },
    postImage: { type: String, trim: true },
    budget: { type: String, trim: true },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
    },
    isVarified: { type: Boolean },
    isSuspended: { type: Boolean },
    isStopped: { type: Boolean, default: false },
    bids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bid",
      },
    ],
  })
);

const validateUserRequest = Joi.object({
  info: Joi.string().required().min(3).max(500),
  subCategory_id: Joi.string().required(),
  category_id: Joi.string(),
  budget: Joi.string(),
  proposedTimeLength: Joi.string(),
  skills: Joi.string()
});

exports.UserRequest = UserRequest;
exports.validateUserRequest = validateUserRequest;
