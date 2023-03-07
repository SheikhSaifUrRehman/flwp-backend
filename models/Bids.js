const mongoose = require("mongoose");
const Joi = require("joi");

const bid_schema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, 
  },
  info: { type: String },
  proposed_budget: { type: String },
  proposed_time: { type: String },
  request_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserRequest",
  },
  status: {
    type: String,
    default: "Pending"
  }
});

const Bid = mongoose.model("Bid", bid_schema);

const validateBid = Joi.object({
  info: Joi.string().required().min(3).max(500),
  proposed_budget: Joi.string().required(),
  proposed_time: Joi.string(),
});

exports.Bid = Bid;
exports.validateBid = validateBid;