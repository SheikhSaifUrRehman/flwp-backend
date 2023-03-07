const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const config = require('config');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config.get('mailKey'));
const Joi = require('joi');
const cloudinary = require('cloudinary').v2;
const createError = require('http-errors');
const {
  signAccessToken,
  verifyAccessToken,
  signRefeshToken,
  verifyRefreshToken,
} = require('./../helpers/jwt_helpers_admin');
const { Admin, validateAdmin, loginSchema } = require('../models/Admins');

router.post('/', async (req, res, next) => {
  try {
    const result = await validateAdmin.validateAsync(
      {
        name: req.body.name,
        password: req.body.password,
        email: req.body.email,
      },
      { abortEarly: false }
    );
    let admin = await Admin.findOne({
      email: result.email,
    });
    if (admin) throw createError(409, 'Email already registered!');
    else {
      admin = new Admin({
        name: result.name,
        email: result.email,
        password: result.password,
        role: 3,
      });
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(admin.password, salt);
      await admin.save().catch((err) => {
        throw createError(500, 'Server error, Unable to save admin');
      });
      res.status(200).send({ result: 'Admin created' });
    }
  } catch (err) {
    console.log(err);
    if (err.isJoi === true) err.status = 422;
    next(err);
  }
});

router.post('/change-password', async (req, res, next) => {
  try {
    const keySchema = Joi.object({
      new_password: Joi.string()
        .required()
        .min(6)
        .max(30)
        .label('password is required and length must be between 6-30'),
    });
    const result = await keySchema.validateAsync({
      new_password: req.body.new_password,
    });

    if (!req.headers['x-auth-token']) return next(createError.Unauthorized());
    const token = req.headers['x-auth-token'];
    const payload = await verifyAccessToken(token);

    const admin = await Admin.findOne({ _id: payload._id });
    if (!admin) throw createError(404, 'Admin not found');

    const validPassword = await bcrypt.compare(
      req.body.old_password,
      admin.password
    );
    if (!validPassword) throw createError(401, 'Invalid old password.');
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(result.new_password, salt);
    await admin.save();
    res.status(200).json({ result: 'password changed success' });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  // let password = await bcrypt.hash('pass1234', 10);
  // await Admin.create({
  //   email: 'umadahmad1928@gmail.com',
  //   password,
  // });
  try {
    const result = await loginSchema.validateAsync(
      { email: req.body.email, password: req.body.password },
      { abortEarly: false }
    );
    const admin = await Admin.findOne({
      email: result.email,
    });
    if (!admin) throw createError(404, 'Admin not found');
    const validPassword = await bcrypt.compare(result.password, admin.password);
    if (!validPassword) throw createError(401, 'Email/Password not valid');

    const payload = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
    };

    const token = await signAccessToken(payload);
    const refreshToken = await signRefeshToken(payload);

    // const Admin = {
    //   name: admin.name,
    //   email: admin.email,
    //   _id: admin._id,
    //   role: admin.role,
    // };

    res.status(200).send({
      token,
      refreshToken,
      admin,
    });
  } catch (err) {
    console.log(err);
    if (err.isJoi === true)
      return next(createError.BadRequest('Invalid email or password.'));
    next(err);
  }
});

router.get('/refresh-token', async (req, res, next) => {
  try {
    const refreshToken = req.headers['x-auth-token'];
    if (!refreshToken) throw createError.BadRequest();
    let payload = await verifyRefreshToken(refreshToken);
    delete payload['iat'];
    delete payload['exp'];
    delete payload['aud'];
    delete payload['iss'];
    const token = await signAccessToken(payload);
    const refToken = await signRefeshToken(payload);
    res.send({ token, refreshToken: refToken });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.get('/logout', async (req, res, next) => {
  try {
    const refreshToken = req.headers['x-auth-token'];
    if (!refreshToken) throw createError.BadRequest();
    let payload = await verifyRefreshToken(refreshToken);
    res.status(200).json({ result: 'logout successs' });
  } catch (err) {
    next(err);
  }
});

router.get('/self', async (req, res, next) => {
  try {
    if (!req.headers['x-auth-token']) return next(createError.Unauthorized());
    const token = req.headers['x-auth-token'];
    const payload = await verifyAccessToken(token);

    const admin = await Admin.findOne({ _id: payload._id });
    if (!admin) throw createError(404, 'User not found');
    if (admin.isBlocked) throw createError(401, 'Blocked user');

    res.status(200).send({
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/all', async (req, res, next) => {
  try {
    if (!req.headers['x-auth-token']) return next(createError.Unauthorized());
    const token = req.headers['x-auth-token'];
    const payload = await verifyAccessToken(token);
    if (!payload) throw createError(401, 'Unauth');

    const admins = await Admin.find();
    res.status(200).json(admins);
  } catch (err) {
    next(err);
  }
});

router.delete('/', async (req, res, next) => {
  try {
    if (!req.headers['x-auth-token']) return next(createError.Unauthorized());
    const token = req.headers['x-auth-token'];
    const payload = await verifyAccessToken(token);

    const admin = await Admin.findOne({ _id: payload._id });
    if (!admin) throw createError(404, 'Admin not found');
    await admin.remove({ _id: admin._id }).catch((err) => {
      console.log(err);
      return next(createError(500, 'Unabe to delete admin'));
    });
    if (admin) {
      res.status(200).json({ result: 'delete success' });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;
