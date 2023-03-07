const { Contact, validateContact, Team, validateTeam } = require("../models/Utility");
const { Worker } = require("../models/Worker");
const { Category } = require("../models/Categories");
const { UserRequest } = require("../models/UserRequest");
const { Admin } = require("../models/Admins");
const express = require("express");
const router = express.Router();
const Joi = require("joi");
const createError = require("http-errors");




/**
 * @swagger
 * /api/utility/contact:
 *  post:
 *    description: post contact dorm
 *    parameters:
 *      - name: body
 *        in: body
 *        description: pkg name that user bought
 *        required: true
 *        example:
 *          name: "string"
 *          email: "string"
 *          message: "string"
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.post("/contact", async (req, res, next) => {
  try {
    console.log("here")
    const contact = new Contact({
      name: req.body.name,
      email: req.body.email,
      message: req.body.message
    });
    await contact.save();
    res.status(200).json({ result: "Thankyou! our team get back to you soon." });
  } catch (err) {
    console.log(err);
    next(err);
  }
});


/**
 * @swagger
 * /api/utility/contact:
 *  get:
 *    description: get all city
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.get("/contact", async (req, res, next) => {
  try {
    const contact = await Contact.find().catch((err) => {
        throw createError("500", "Server error, unable to get city");
      });
    res.status(200).json(contact);
  } catch (err) {
    console.log(err);
    next(err);
  }
});


/** 
 * @swagger
 * /api/utility/team:
 *  post:
 *    description: post contact dorm
 *    parameters:
 *      - name: body
 *        in: body
 *        description: pkg name that user bought
 *        required: true
 *        example:
 *          name: "string"
 *          email: "string"
 *          contact_number: "string"
 *          skills: "string" 
 *          bio: "string"
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.post("/team", async (req, res, next) => {
  try {
    const team = new Team({
      name: req.body.name,
      email: req.body.email,
      contact_number: req.body.contact_number,
      skills: req.body.skills,
      bio: req.body.bio,
    }); 
    await team.save();
    res
      .status(200)
      .json({ result: "Thankyou! our team get back to you soon." });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

/**
 * @swagger
 * /api/utility/team:
 *  get:
 *    description: get all contact
 *    responses:
 *      '200':
 *        description: A successful response
 */
 router.get("/team", async (req, res, next) => {
  try {
    const team = await Team.find().catch((err) => {
        throw createError("500", "Server error, unable to get city");
      });
    res.status(200).json(team);
  } catch (err) {
    console.log(err);
    next(err);
  }
});



/**
 * @swagger
 * /api/utility/dashboard:
 *  get:
 *    description: only custom user, mail sent with verification code
 *    responses:
 *      '200':
 *        description: A successful response 
 */
router.get("/dashboard", async (req, res, next) => {
  try {
    const workers = await Worker.find().countDocuments();
    const categories = await Category.find().countDocuments();
    const userRequests = await UserRequest.find().countDocuments();
    const admins = await Admin.find().countDocuments();

    res.status(200).json({ workers, categories, userRequests, admins });

  } catch (err) {
    console.log(err);
    next(err);
  }
});



// end routes
// exports
module.exports = router;
