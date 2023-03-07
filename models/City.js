const mongoose = require("mongoose");
const Joi = require("joi");

const AreaSchema = new mongoose.Schema({
  name: { type: String },
  coordinates: { type: String },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City",
    required: true,
  },
}); 

const CitySchema = new mongoose.Schema({
  name: { type: String },
  areas: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Area",
    },
  ], 
}); 

const Area = mongoose.model("Area", AreaSchema);
const City = mongoose.model("City", CitySchema);

const validateArea = Joi.object({
  name: Joi.string().required(),
  coordinates: Joi.string().required(),
  city: Joi.string().required(),
});

const validateCity = Joi.object({
  name: Joi.string().required(),
  areas: Joi.string().required(),
});

exports.Area = Area;
exports.validateArea = validateArea;
exports.City = City;
exports.validateCity = validateCity;
