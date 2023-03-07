const mongoose = require("mongoose");
const Joi = require("joi");

const subCategorySchema = new mongoose.Schema({
  name: String,
  imageUrl: String,
  category_id: {
    type: mongoose.Schema.ObjectId,
    ref: "Category",
  },  
});
const SubCategory = mongoose.model("SubCategory", subCategorySchema);
 
const CategorySchema = new mongoose.Schema({
  name: String,
  imageUrl: String,
  SubCategory: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "SubCategory",
    },
  ],
});
const Category = mongoose.model("Category", CategorySchema);

const validateSubCategory = Joi.object({
  name: Joi.string().required(),
  imageUrl: Joi.string().required(),
  SubCategory: Joi.string().required(),
});

const validateCategory = Joi.object({
  name: Joi.string().required(),
  imageUrl: Joi.string().required(),
  category_id: Joi.string().required(),
});

exports.Category = Category;
exports.validateCategory = validateCategory;
exports.SubCategory = SubCategory;
exports.validateSubCategory = validateSubCategory;
 