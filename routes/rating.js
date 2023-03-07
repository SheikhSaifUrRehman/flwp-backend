const { Rating } = require("../models/Rating");
const { Worker } = require("../models/Worker");
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
 * /api/rating/:
 *  get:
 *    description: get all city
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.get("/", async (req, res, next) => {
  try {
    await Rating.find()
      .sort({ _id: -1 })
      .then((ratings) => res.send(ratings))
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
 * /api/rating/:
 *  post:
 *    description: post city
 *    parameters:
 *      - name: body
 *        in: body
 *        description: pkg name that user bought
 *        required: true
 *        example:
 *          rating: "string"
 *          review: "string"
 *          worker_id: "string"
 *          user_id: "string"
 *    security:
 *      - Bearer: []
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.post("/", async (req, res, next) => {
  try {
    // if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    // const token = req.headers["x-auth-token"];
    // const payload = await verifyAccessToken(token);
    // if (!payload) throw createError(401, "Unauthorized");

    const rating = new Rating({
      rating: parseInt(req.body.rating),
      review: req.body.review,
      worker_id: req.body.worker_id,
      user_id: req.body.user_id,
    });
    await rating.save();
    const worker = await Worker.findOne({ _id: rating.worker_id });
    worker.rating.push(rating);
    worker.save();
    res.send(worker);
  } catch (err) {
    console.log(err);
    res.status(500).send("server error");
  }
});

/**
 * @swagger
 * /api/rating/{id}:
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

    const result = await Rating.deleteOne({ _id: req.params.id }).catch((err) =>
      console.log(err)
    );
    if (result.deletedCount > 0) res.status(200).send("delete success");
    else res.status(400).send("error, unable to delete");
  } catch (err) {
    console.log(err);
    res.status(500).send("server error");
  }
});

// end routes
// exports
module.exports = router;
