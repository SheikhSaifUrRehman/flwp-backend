const { City, Area } = require("../models/City");
const express = require("express");
const router = express.Router();
const Joi = require("joi");
const createError = require("http-errors");
const {
  signAccessToken,
  verifyAccessToken,
  signRefeshToken,
  verifyRefreshToken,
  verifyAccessTokens,
} = require("./../helpers/jwt_helpers_admin");

/**
 * @swagger
 * /api/city/:
 *  get:
 *    description: get all city
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.get("/", async (req, res, next) => {
  try {
    await City.find()
      .sort({ _id: -1 })
      .populate("areas", "name coordinates")
      .then((city) => res.send(city))
      .catch((err) => {
        throw createError("500", "Server error, unable to get city");
      });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

/**
 * @swagger
 * /api/city/get-one/{id}:
 *  get:
 *    description: get all city
 *    parameters:
 *      - name: id
 *        in: path
 *        description: id of user
 *        required: true
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.get("/get-one/:id", async (req, res, next) => {
  try {
    await City.findOne({ _id: req.params.id })
      .populate("areas", "name coordinates")
      .then((city) => res.send(city))
      .catch((err) => {
        throw createError("500", "Server error, unable to get city");
      });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

/**
 * @swagger
 * /api/city/:
 *  post:
 *    description: post city
 *    parameters:
 *      - name: body
 *        in: body
 *        description: pkg name that user bought
 *        required: true
 *        example:
 *          name: "string"
 *    security:
 *      - Bearer: []
 *    responses:
 *      '200': 
 *        description: A successful response
 */
router.post("/", async (req, res) => {
  try {
    if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    const token = req.headers["x-auth-token"];
    const payload = await verifyAccessToken(token);

    if (!payload) throw createError(401, "Unauthorized");

    const city = new City({ name: req.body.name });
    await city.save();
    res.send(city);
  } catch (err) {
    console.log(err);
    res.status(500).send("server error");
  }
});

// /**
//  * @swagger
//  * /api/city/:
//  *  put:
//  *    description: post city
//  *    parameters:
//  *      - name: body
//  *        in: body
//  *        description: city {name}
//  *        required: true
//  *        example:
//  *          _id: "object_id"
//  *          name: "string"
//  *    security:
//  *      - Bearer: []
//  *    responses:
//  *      '200':
//  *        description: A successful response
//  */
router.put("/", async (req, res) => {
  try {
    if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    const token = req.headers["x-auth-token"];
    const payload = await verifyAccessToken(token);
    if (!payload) throw createError(401, "Unauthorized");

    const citySchema = Joi.string()
      .required()
      .min(1)
      .label("city name should have at least one character.");

    const { error } = citySchema.validate(req.body.name);
    let city = await City.findOne({ _id: req.body._id });
    if (!city) return res.status(404).send("City not found");
    city.name = req.body.name;
    await city.save();
    res.send(city);
  } catch (err) {
    console.log(err);
    res.status(500).send("server error");
  }
});

/**
 * @swagger
 * /api/city/{id}:
 *  delete:
 *    description: delete pkg
 *    parameters:
 *      - name: id
 *        in: path
 *        description: id of city
 *        required: true
 *    security:
 *      - Bearer: []
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.delete("/:id", async (req, res) => {
  try {
    if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    const token = req.headers["x-auth-token"];
    const payload = await verifyAccessToken(token);

    if (!payload) throw createError(401, "Unauthorized");

    await City.deleteOne({ _id: req.params.id }).catch((err) => {
      console.log(err);
      res.send(err);
    }
    );

    await Area.deleteMany({ city: req.params.id }).catch((err) => {
      console.log(err);
      res.send(err);

    }
    );


    res.status(200).send("delete success");

  } catch (err) {
    console.log(err);
    res.status(500).send("server error");
  }
});

/**
 * @swagger
 * /api/city/area:
 *  post:
 *    description: find users by area
 *    parameters:
 *      - name: body
 *        in: body
 *        description: asd
 *        required: true
 *        example:
 *            city_id: "string"
 *            name: "string"
 *            coordinates: "string"
 *    security:
 *      - Bearer: []
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.post("/area", async (req, res, next) => {
  try {
    if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    const token = req.headers["x-auth-token"];
    const payload = await verifyAccessToken(token);

    if (!payload) throw createError(401, "Unauthorized");

    const city = await City.findOne({ _id: req.body.city_id });
    const area = new Area({
      name: req.body.name,
      coordinates: req.body.coordinates,
      city: city._id,
    });
    await area.save();

    city.areas.push(area._id);
    await city.save();
    res.send(area);

  } catch (err) {
    console.log(err);
    next(err);
  }
});

//   /**
//  * @swagger
//  * /api/packages/:
//  *  post:
//  *    description: post user package
//  *    parameters:
//  *      - name: body
//  *        in: body
//  *        description: pkg name that user bought {price, name, description}
//  *        required: true
//  *    security:
//  *      - Bearer: []
//  *    responses:
//  *      '200':
//  *        description: A successful response
//  */
router.get("/area/:city_id", async (req, res) => {
  try {
    const city = await City.findOne({ _id: city_id });
    if (!city) return res.status(400).send("city not found");
    res.send(city.areas);
  } catch (err) {
    console.log(err);
    res.status(500).send("server error");
  }
});

//   /**
//  * @swagger
//  * /api/packages/:
//  *  post:
//  *    description: post user package
//  *    parameters:
//  *      - name: body
//  *        in: body
//  *        description: pkg name that user bought {price, name, description}
//  *        required: true
//  *    security:
//  *      - Bearer: []
//  *    responses:
//  *      '200':
//  *        description: A successful response
//  */
router.put("/area", async (req, res) => {
  try {
    // const { error } = validatePost.validate(req.body);
    // if (error) return res.status(400).send(error.details[0].message);
    let area = await Area.findOne({ _id: req.body._id }).populate(
      "category_id",
      "_id name coordinates"
    );
    if (!area) return res.status(404).send("sub-cat not found");
    area.name = req.body.name;
    area.coordinates = req.body.coordinates;
    await area.save();

    await City.find()
      .sort({ _id: -1 })
      .populate("area")
      .sort({ _id: -1 })
      .then((city) => res.send(city))
      .catch((err) => res.status(500).send("server error"));
  } catch (err) {
    console.log(err);
    res.status(500).send("server error");
  }
});

// /**
//  * @swagger
//  * /api/city/area/{city_id}:
//  *  get:
//  *    description: find users by area
//  *    security: 
//  *      - Bearer: []
//  *    responses:
//  *      '200':
//  *        description: A successful response
//  */
router.delete("/area/:id", async (req, res) => {
  try {
    // const { error } = validatePo//api/cist.validate(req.body);
    // if (error) return res.status(400).send(error.details[0].message);
    await Area.deleteOne({ _id: req.params.id }).catch((err) =>
      console.log(err)
    );

    await City.find()
      .sort({ _id: -1 })
      .populate("area")
      .sort({ _id: -1 })
      .then((city) => res.send(city))
      .catch((err) => res.status(500).send("server error"));
  } catch (err) {
    console.log(err);
    res.status(500).send("server error");
  }
});

// end routes
// exports
module.exports = router;
