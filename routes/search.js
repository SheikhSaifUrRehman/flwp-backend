const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const { Category, SubCategory } = require("./../models/Categories");
const { City } = require("./../models/City");
const { Worker } = require("./../models/Worker");
const { UserRequest } = require("./../models/UserRequest");

/**
 * @swagger
 * /api/search/info:
 *  get:
 *    description: get list all business return Array
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.get("/info/workers", async (req, res, next) => {
  try {
    const category = await Category.find()
      .select("name")
      .sort({ _id: -1 })
      .populate("SubCategory", "name");

    const city = await City.find()
      .select("name")
      .sort({ _id: -1 })
      .populate("areas", "name");

    res.send({ category, city });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.get("/info/userrequests", async (req, res, next) => {
  try {
    const category = await Category.find()
      .select("name")
      .sort({ _id: -1 })
      .populate("SubCategory", "name");

    const subCategory = await SubCategory.find()
      .select("name")
      .sort({ _id: -1 })
      .populate("areas", "name");

    res.send({ category, subCategory });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

/**
 * @swagger
 * /api/search/:
 *  get:
 *    description: get list all business return Array
 *    parameters:
 *      - name: pageNumber
 *        in: query
 *        description: pagenumber
 *      - name: pageSize
 *        in: query
 *        description: pageSize
 *      - name: category
 *        in: query
 *        description: category
 *      - name: subCategory
 *        in: query
 *        description: subCategory
 *      - name: city
 *        in: query
 *        description: city
 *      - name: area
 *        in: query
 *        description: area
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.get("/workers", async (req, res, next) => {
  try {
    const pageNumber = parseInt(req.query.pageNumber);
    const pageSize = parseInt(req.query.pageSize);
    const category = req.query.category;
    const subCategory = req.query.subCategory;
    const city = req.query.city;
    const area = req.query.area;

    // let business = await Business.find({
    //   name: { $regex: ".*" + req.query.keyword + ".*" },
    //   name: { $regex: new RegExp("^" + keyword.toLowerCase(), "i") },
    // }) 

    var filters = {
      subCategory_id: subCategory,
      category_id: category, 
      is_verified: true,
      area,
      city,
    };

    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key]
    );

    let result = [];
    result = await Worker.find({ ...filters })
      .populate("subCategory_id", "name")
      .populate("category_id", "name")
      .populate("u_id", "name");

    res.status(200).send({ result });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.get("/userrequests", async (req, res, next) => {
  try {
    const pageNumber = parseInt(req.query.pageNumber);
    const pageSize = parseInt(req.query.pageSize);
    const category = req.query.category;
    const subCategory = req.query.subCategory;

    var filters = {
      subCategory_id: subCategory,
      category_id: category
    };

    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key]
    );

    let result = [];
    result = await UserRequest.find({ ...filters })
      .populate("subCategory_id", "name")
      .populate("category_id", "name")
      .populate("user_id", "name");

      console.log(result);

    res.status(200).send({ result });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;
