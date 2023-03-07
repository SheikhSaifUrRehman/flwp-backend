const { Skills } = require("../models/Skills");
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
 * /api/skills/:
 *  get:
 *    description: get all city
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.get("/", async (req, res, next) => {
  try {
    await Skills.find()
      .sort({ _id: -1 })
      .then((skills) => res.send(skills))
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
 * /api/skills/:
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

    const skills = new Skills({ name: req.body.name });
    await skills.save();
    res.send(skills);
  } catch (err) {
    console.log(err);
    res.status(500).send("server error");
  }
});

/**
 * @swagger
 * /api/skills/{id}:
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

    const result = await Skills.deleteOne({ _id: req.params.id }).catch((err) =>
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
