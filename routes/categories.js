const { Industry, Category, SubCategory } = require('../models/Categories');
const express = require('express');
const router = express.Router();
const createError = require('http-errors');
const Joi = require('joi');
const {
  signAccessToken,
  verifyAccessToken,
  signRefeshToken,
  verifyRefreshToken,
  verifyAccessTokens,
} = require('../helpers/jwt_helpers_admin');

// category routes
/**
 * @swagger
 * /api/categories/all:
 *  get:
 *    description: get all industry
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.get('/all', async (req, res, next) => {
  try {
    await Category.find()
      .sort({ _id: -1 })
      .populate('SubCategory', 'name')
      .then((categories) => res.status(200).json(categories))
      .catch((err) => createError(500, 'unable to get categories'));
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.get('/home-page', async (req, res, next) => {
  try {
    await Category.find()
      .sort({ _id: -1 })
      .populate('SubCategory', 'name')
      .limit(12)
      .then((categories) => res.status(200).json(categories))
      .catch((err) => createError(500, 'unable to get categories'));
  } catch (err) {
    console.log(err);
    next(err);
  }
});

/**
 * @swagger
 * /api/categories:
 *  post:
 *    description: post Catgory
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
router.post('/', async (req, res, next) => {
  try {
    if (!req.headers['x-auth-token']) return next(createError.Unauthorized());
    const token = req.headers['x-auth-token'];
    const payload = await verifyAccessToken(token);

    if (!payload) throw createError(401, 'Unauthorized');

    const category = new Category({
      name: req.body.name,
      imageUrl: req.body.imageUrl,
    });
    await category.save();
    res.status(200).json(category);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.put('/', async (req, res) => {
  try {
    // const { error } = validatePost.validate(req.body);
    // if (error) return res.status(400).send(error.details[0].message);
    let cat = await Category.findOne({ _id: req.body._id }).populate(
      'SubCategory',
      '_id name'
    );
    if (!cat) return res.status(404).send('cat not found');
    cat.name = req.body.name;
    await cat.save();

    const indus = await Industry.find()
      .sort({ _id: -1 })
      .populate('Category', 'name  SubCategory _id')
      .populate({
        path: 'Category',
        populate: {
          path: 'SubCategory',
          model: 'SubCategory',
          select: 'name _id',
        },
      });

    res.send(indus);
  } catch (err) {
    console.log(err);
    res.status(500).send('server error');
  }
});

/**
 * @swagger
 * /api/categories/{id}:
 *  delete:
 *    description: delete category
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
router.delete('/:id', async (req, res, next) => {
  try {
    if (!req.headers['x-auth-token']) return next(createError.Unauthorized());
    const token = req.headers['x-auth-token'];
    const payload = await verifyAccessToken(token);
    if (!payload) throw createError(401);

    await Category.deleteOne({ _id: req.params.id }).catch((err) => {
      console.log(err);
      next(err);
    });

    await SubCategory.deleteMany({ category_id: req.params.id }).catch(
      (err) => {
        console.log(err);
        next(err);
      }
    );

    res.status(202).send('Delete Category success');
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// Sub category routes

/**
 * @swagger
 * /api/categories/subCategory:
 *  post:
 *    description: find users by area
 *    parameters:
 *      - name: body
 *        in: body
 *        description: asd
 *        required: true
 *        example:
 *            category_id: "string"
 *            name: "string"
 *    security:
 *      - Bearer: []
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.post('/subCategory', async (req, res) => {
  try {
    if (!req.headers['x-auth-token']) return next(createError.Unauthorized());
    const token = req.headers['x-auth-token'];
    const payload = await verifyAccessToken(token);

    if (!payload) throw createError(401, 'Unauthorized');

    const category = await Category.findOne({ _id: req.body.category_id });
    if (!category) return res.status(404).send('cat not found');
    const subCat = new SubCategory({
      name: req.body.name,
      category_id: category._id,
    });
    await subCat.save();
    category.SubCategory.push(subCat._id);
    await category.save();
    res.status(200).json(subCat);
  } catch (err) {
    console.log(err);
    res.status(500).send('server error');
  }
});

/**
 * @swagger
 * /api/categories/subCategory:
 *  get:
 *    description: get all industry
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.get('/subCategory', async (req, res, next) => {
  try {
    await SubCategory.find()
      .populate('category_id', 'name')
      .populate('industry_id', 'name')
      .sort({ _id: -1 })
      .then((data) => res.status(200).json(data))
      .catch((err) => {
        throw createError(500, 'unable to get subCargories');
      });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.put('/subCategory', async (req, res) => {
  try {
    // const { error } = validatePost.validate(req.body);
    // if (error) return res.status(400).send(error.details[0].message);
    let subCat = await SubCategory.findOne({ _id: req.body._id })
      .populate('category_id', '_id name')
      .populate('industry_id', '_id name');
    if (!subCat) return res.status(404).send('sub-cat not found');
    subCat.name = req.body.name;
    await subCat.save();

    const indus = await Industry.find()
      .sort({ _id: -1 })
      .populate('Category', 'name  SubCategory _id')
      .populate({
        path: 'Category',
        populate: {
          path: 'SubCategory',
          model: 'SubCategory',
          select: 'name _id',
        },
      });

    res.send(indus);
  } catch (err) {
    console.log(err);
    res.status(500).send('server error');
  }
});

/**
 * @swagger
 * /api/categories/subCategory/{id}:
 *  delete:
 *    description: delete category
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
router.delete('/subCategory/:id', async (req, res) => {
  try {
    if (!req.headers['x-auth-token']) return next(createError.Unauthorized());
    const token = req.headers['x-auth-token'];
    const payload = await verifyAccessToken(token);
    if (!payload) throw createError(401);

    await SubCategory.deleteOne({ _id: req.params.id }).catch((err) => {
      console.log(err);
      res.send(err);
    });

    res.status(202).send('Sub category deleted success');
  } catch (err) {
    console.log(err);
    res.status(500).send('server error');
  }
});

// end routes
// exports
module.exports = router;
