const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const config = require("config");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(config.get("mailKey"));
const Joi = require("joi");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const createError = require("http-errors");
const {
  signAccessToken,
  verifyAccessToken,
  signRefeshToken,
  verifyRefreshToken,
} = require("./../helpers/jwt_helpers");
const {
  User,
  validateSocialUser,
  validateCustomUser,
  loginSchema,
  validateUpdateUser,
} = require("../models/Users");
const Notification = require("../models/Notification");

cloudinary.config({
  cloud_name: config.get("cloudinary_cloud_name"),
  api_key: config.get("cloudinary_api_key"),
  api_secret: config.get("cloudinary_api_secret"),
});
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
    cb(null, true);
  } else {
    cb(new Error("not a image"), false);
  }
};
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 2 }, //max file size 2MB
  fileFilter: fileFilter,
});

router.post("/social", async (req, res, next) => {
  try {
    const result = await validateSocialUser.validateAsync(
      {
        name: req.body.name,
        email: req.body.email,
        id: req.body.id,
        imageUrl: req.body.imageUrl,
      },
      { abortEarly: false } // return all errors
    );
    let user;
    if (req.body.isGoogleUser)
      user = await User.findOne({
        email: req.body.email,
        isGoogleUser: true,
      });
    else if (req.body.isFacebookUser)
      user = await User.findOne({
        email: req.body.email,
        isFacebookUser: true,
      });
    else {
      throw createError.BadRequest();
    }
    if (user) {
      const payload = {
        _id: user._id,
        isGoogleUser: user.isGoogleUser,
        isFacebookUser: user.isFacebookUser,
        isCustomUser: user.isCustomUser,
        isVerified: user.isVerified,
        isBlocked: user.isBlocked,
        forgotPassword: user.forgotPassword,
      };
      const token = await signAccessToken(payload);
      const refreshToken = await signRefeshToken(payload);
      res.status(200).json({ token, refreshToken });
    } else {
      user = new User({
        name: result.name,
        email: result.email,
        id: result.id,
        imageUrl: result.imageUrl,
        isGoogleUser: req.body.isGoogleUser,
        isFacebookUser: req.body.isFacebookUser,
        isCustomUser: false,
        isVerified: true,
      });
      const message = {
        from: "u.ahmadnode@gmail.com",
        to: user.email,
        subject: "EMAIL TESTING",
        text: "this is testing of email for Smurf App",
        html: `<strong>welcome to Smurf App, your account is now registered with  Smurf App </strong>`,
      };
      await sgMail
        .send(message)
        .then((mailData) => {
          console.log(mailData);
        })
        .catch((err) => createError(500, "server error, unable to send mail"));
      await user.save().catch((err) => {
        console.log(err);
        throw createError(500, "unable to save user");
      });
      const payload = {
        _id: user._id,
        isGoogleUser: user.isGoogleUser,
        isFacebookUser: user.isFacebookUser,
        isCustomUser: user.isCustomUser,
        isVerified: user.isVerified,
        isBlocked: user.isBlocked,
        forgotPassword: user.forgotPassword,
      };
      const token = await signAccessToken(payload);
      const refreshToken = await signRefeshToken(payload);
      res.status(200).json({ token, refreshToken, mail: `Email Sent` });
    }
  } catch (err) {
    if (err.isJoi === true) err.status = 422;
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const result = await validateCustomUser.validateAsync(
      {
        name: req.body.name,
        email: req.body.email,
        contact_number: req.body.contact_number,
        password: req.body.password,
      },
      { abortEarly: false }
    );
    let user = await User.findOne({ email: result.email });
    if (user) throw createError(409, "Email already registered!");
    else {
      user = new User({
        name: result.name,
        email: result.email,
        password: result.password,
        contact_number: result.contact_number,
        isGoogleUser: false,
        isFacebookUser: false,
        isCustomUser: true,
        isVerified: true,
      });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      user.verificationKey = Math.floor(1000 + Math.random() * 9000);
      const message = {
        from: "u.ahmadnode@gmail.com",
        to: user.email,
        subject: "EMAIL TESTING for Smurf App",
        text: "this is testing of email for Smurf App",
        html: `<strong>Your verification code  is ${user.verificationKey}</strong>`,
      };
      // await sgMail
      //   .send(message)
      //   .then((mailData) => console.log(mailData))
      //   .catch((err) => {
      //     console.log(err);
      //     throw createError(500, "Server error, Unable to send mail");
      //   });
      await user.save().catch((err) => {
        console.log(err);
        throw createError(500, "Server error, Unable to save user");
      });
      const payload = {
        _id: user._id,
        isGoogleUser: user.isGoogleUser,
        isFacebookUser: user.isFacebookUser,
        isCustomUser: user.isCustomUser,
        isVerified: user.isVerified,
        isBlocked: user.isBlocked,
        isWorker: user.isWorker,
        forgotPassword: user.forgotPassword,
      };
      const token = await signAccessToken(payload);
      const refreshToken = await signRefeshToken(payload);
      res.status(200).send({ token, refreshToken, mail: "Email Sent" });
    }
  } catch (err) {
    console.log(err);
    if (err.isJoi === true) err.status = 422;
    next(err);
  }
});
router.get("/all", async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    users: users.length,
  });
});

router.get("/resendmail", async (req, res, next) => {
  try {
    if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    const token = req.headers["x-auth-token"];
    const payload = await verifyAccessToken(token);

    if (payload.isVerified)
      throw createError(401, "Unauthorized, already verifired account");
    if (payload.isBlocked) throw createError(401, "Blocked user");
    const user = await User.findOne({ _id: payload._id });

    const message = {
      from: "u.ahmadnode@gmail.com",
      to: user.email,
      subject: "EMAIL TESTING",
      text: "this is testing of email for smurf-app",
      html: `<strong>Your resend verification code  is ${user.verificationKey}</strong>`,
    };

    await sgMail
      .send(message)
      .then(() => res.status(200).json({ result: "resend email completed" }))
      .catch((err) => {
        console.log(err);
        throw createError(500, "unable to send mail");
      });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.post("/verifymail", async (req, res, next) => {
  try {
    if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    const token = req.headers["x-auth-token"];
    const payload = await verifyAccessToken(token);

    const keySchema = Joi.object({
      verificationKey: Joi.string().required().min(4).max(4),
    });
    const result = await keySchema.validateAsync({
      verificationKey: req.body.verificationKey,
    });

    let user = await User.findOne({
      _id: payload._id,
      isCustomUser: true,
    });
    if (!user) throw createError(404, "User not found");
    if (user.isVerified)
      throw createError(401, "Unauthorized, already verifired account");
    if (user.isBlocked) throw createError(401, "Blocked user");
    if (result.verificationKey === user.verificationKey) {
      await User.findOneAndUpdate(
        { _id: user._id },
        { $set: { isVerified: true, verificationKey: undefined } },
        { new: true }
      )
        .then(async (new_user) => {
          const payload = {
            _id: new_user._id,
            isGoogleUser: new_user.isGoogleUser,
            isFacebookUser: new_user.isFacebookUser,
            isCustomUser: new_user.isCustomUser,
            isVerified: new_user.isVerified,
            roles: new_user.roles,
            isWorker: user.isWorker,
            isBlocked: new_user.isBlocked,
            forgotPassword: new_user.forgotPassword,
          };
          const token = await signAccessToken(payload);
          const refreshToken = await signRefeshToken(payload);
          console.log("sending response");
          res.status(200).json({
            token,
            refreshToken,
            result: "verification completed",
          });
        })
        .catch((err) => {
          console.log(err);
          throw createError.InternalServerError();
        });
    } else throw createError(400, "verification not completed");
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.get("/forgot-password", async (req, res, next) => {
  try {
    if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    const token = req.headers["x-auth-token"];
    const payload = await verifyAccessToken(token);

    const user = await User.findOne({ _id: payload._id });
    if (!user) throw createError(404, "User not found");
    if (user.isBlocked) throw createError(401, "Blocked user");
    if (!user.isVerified)
      throw createError(401, "Unauthorized, not verifired account");
    if (user.forgotPassword)
      throw createError(401, "Unauthorized, check email");

    user.forgotPassword = true;
    user.recoverypasswordKey = Math.floor(1000 + Math.random() * 9000);
    await user.save().catch((err) => {
      throw createError(500, "unable to dave user");
    });
    const message = {
      from: "UmadAhmad1928@gmail.com",
      to: user.email,
      subject: "EMAIL TESTING Forgot password",
      text: "this is testing of email for smurf-app",
      html: `<strong>oops! forgot password, your recovery key is ${user.recoverypasswordKey}</strong>`,
    };
    await sgMail.send(message).catch((err) => {
      throw createError(500, "unable to send mail");
    });

    res.status(200).json({
      result: `verification code to reset your password is sent to you on your registered mail ${user.email}`,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.post("/change-forgot-password", async (req, res, next) => {
  try {
    if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    const token = req.headers["x-auth-token"];
    const payload = await verifyAccessToken(token);

    const user = await User.findOne({ _id: payload._id });
    if (!user) throw createError(404, "User not found");
    if (user.isBlocked) throw createError(401, "Blocked user");
    if (!user.isVerified)
      throw createError(401, "Unauthorized, not verifired account");
    if (!user.recoverypasswordKey)
      throw createError(500, "not authorized to access this resource");

    if (user.recoverypasswordKey !== req.body.password_recovery_key)
      throw createError(400, "invalid revcovery key check mail again");

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.new_password, salt);
    user.recoverypasswordKey = undefined;
    await user.save();
    const message = {
      from: "UmadAhmad1928@gmail.com",
      to: user.email,
      subject: "EMAIL TESTING Forgot password",
      text: "this is testing of email for smurf-app",
      html: `<strong>Your password has been changed</strong>`,
    };
    await sgMail.send(message).catch((err) => {
      throw createError(500, "server error, unable to send mail");
    });
    res.status(200).json({ result: "password changed success" });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.post("/change_password", async (req, res, next) => {
  try {
    const keySchema = Joi.object({
      new_password: Joi.string()
        .required()
        .min(6)
        .max(30)
        .label("password is required and length must be between 6-30"),
    });
    const result = await keySchema.validateAsync({
      new_password: req.body.new_password,
    });

    if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    const token = req.headers["x-auth-token"];
    const payload = await verifyAccessToken(token);

    const user = await User.findOne({ _id: payload._id });
    if (!user) throw createError(404, "User not found");
    if (user.isBlocked) throw createError(401, "Blocked user");
    if (!user.isVerified)
      throw createError(401, "Unauthorized, not verifired account");

    const validPassword = await bcrypt.compare(
      req.body.old_password,
      user.password
    );
    if (!validPassword) throw createError(401, "Invalid old password.");
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(result.new_password, salt);
    await user.save();
    const message = {
      from: "UmadAhmad1928@gmail.com",
      to: user.email,
      subject: "EMAIL TESTING Forgot password",
      text: "this is testing of email for smurf-app",
      html: `<strong>Your password has been changed</strong>`,
    };
    await sgMail.send(message).catch((err) => {
      throw createError(500, "unable to send mail");
    });
    res.status(200).json({ result: "password changed success" });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.post("/contact_number", async (req, res) => {
  try {
    const contactSchema = Joi.string()
      .required()
      .min(10)
      .max(11)
      .label("password is required in format (03306304513) or (0512123123)");
    const { error } = contactSchema.validate(req.body.contact_number);
    if (error) return res.status(400).send(error.details);
    let user = await User.findOne({ _id: req.user._id });
    user.contact_number = req.body.contact_number;
    await user.save();
    res.status(200).send({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        contact_number: user.contact_number,
        recentSearches: user.recentSearches,
        isGoogleUser: user.isGoogleUser,
        isFacebookUser: user.isFacebookUser,
        isCustomUser: user.isCustomUser,
        isVerified: user.isVerified,
        isBlocked: user.isBlocked,
        forgotPassword: user.forgotPassword,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("server error");
  }
});

router.post("/profile_image", [upload.single("img")], async (req, res) => {
  try {
    // const contactSchema = Joi.string().required().min(10).max(11).label("password is required in format (03306304513) or (0512123123)");
    // const { error } = contactSchema.validate( req.body.contact_number );
    // if (error) return res.status(400).send( error.details );
    let user = await User.findOne({ _id: req.user._id });
    const url = "";
    const result = await cloudinary.uploader.upload(req.files.img);
    console.log(result);
    // user.imageUrl = url;
    // await user.save();
    res.send(user);
  } catch (err) {
    console.log(err);
    res.status(500).send("server error");
  }
});

router.post("/login", async (req, res, next) => {
  console.log("hereeeeeeeeeeeeeeeee");
  try {
    const result = await loginSchema.validateAsync(
      { email: req.body.email, password: req.body.password },
      { abortEarly: false }
    );
    const user = await User.findOne({
      email: result.email,
      isCustomUser: true,
    }).populate({
      path: "workerId",
      select: "is_verified",
    });
    if (!user) throw createError(404, "User not found");
    const validPassword = await bcrypt.compare(result.password, user.password);
    if (!validPassword) throw createError(401, "Email/Password not valid");
    if (user.isBlocked) throw createError(401, "Blocked user");
    if (user.isCustomUser) {
      const payload = {
        _id: user._id,
        isGoogleUser: user.isGoogleUser,
        isFacebookUser: user.isFacebookUser,
        isCustomUser: user.isCustomUser,
        isVerified: user.isVerified,
        roles: user.roles,
        isWorker: user.isWorker,
        isBlocked: user.isBlocked,
        forgotPassword: user.forgotPassword,
      };
      const token = await signAccessToken(payload);
      const refreshToken = await signRefeshToken(payload);

      res.status(200).send({
        token,
        refreshToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          imageUrl: user.imageUrl,
          contact_number: user.contact_number,
          recentSearches: user.recentSearches,
          isGoogleUser: user.isGoogleUser,
          isWorker: user.isWorker,
          isFacebookUser: user.isFacebookUser,
          isCustomUser: user.isCustomUser,
          isVerified: user.isVerified,
          isBlocked: user.isBlocked,
          forgotPassword: user.forgotPassword,
          notifications: user.notifications,
          worker: user.workerId,
        },
      });
    } else {
      throw createError("401", "Unauthorized, login with Social media account");
    }
  } catch (err) {
    console.log(err);
    if (err.isJoi === true)
      return next(createError.BadRequest("Invalid email or password."));
    next(err);
  }
});

router.get("/refresh-token", async (req, res, next) => {
  try {
    const refreshToken = req.headers["x-auth-token"];
    if (!refreshToken) throw createError.BadRequest();
    let payload = await verifyRefreshToken(refreshToken);
    delete payload["iat"];
    delete payload["exp"];
    delete payload["aud"];
    delete payload["iss"];
    const token = await signAccessToken(payload);
    const refToken = await signRefeshToken(payload);
    res.send({ token, refreshToken: refToken });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.get("/logout", async (req, res, next) => {
  try {
    const refreshToken = req.headers["x-auth-token"];
    if (!refreshToken) throw createError.BadRequest();
    let payload = await verifyRefreshToken(refreshToken);
    res.status(200).json({ result: "logout success" });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  console.log("hereeeeeeeeeeeeeeeee");

  try {
    if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    const token = req.headers["x-auth-token"];
    console.log("token :>> ", token);
    const payload = await verifyAccessToken(token);

    const user = await User.findOne({ _id: payload._id }).populate({
      path: "workerId",
      select: "is_verified",
    });
    if (!user) throw createError(404, "User not found");
    if (user.isBlocked) throw createError(401, "Blocked user");

    res.status(200).send({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        contact_number: user.contact_number,
        recentSearches: user.recentSearches,
        isGoogleUser: user.isGoogleUser,
        isFacebookUser: user.isFacebookUser,
        isCustomUser: user.isCustomUser,
        isVerified: user.isVerified,
        isBlocked: user.isBlocked,
        isWorker: user.isWorker,
        forgotPassword: user.forgotPassword,
        notifications: user.notifications,
        worker: user.workerId,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/get-one/:id", async (req, res, next) => {
  try {
    let user = await User.findOne({ _id: req.params.id }).populate({
      path: "workerId",
      select: "is_verified",
    });
    if (!user) throw createError(404, "User not found");
    if (user.isBlocked) throw createError(401, "Blocked user");
    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        contact_number: user.contact_number,
        recentSearches: user.recentSearches,
        isGoogleUser: user.isGoogleUser,
        isFacebookUser: user.isFacebookUser,
        isCustomUser: user.isCustomUser,
        isVerified: user.isVerified,
        isBlocked: user.isBlocked,
        forgotPassword: user.forgotPassword,
      },
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    const token = req.headers["x-auth-token"];
    const payload = await verifyAccessToken(token);

    const user = await User.findOne({ _id: payload._id });
    if (!user) throw createError(404, "User not found");
    await User.remove({ _id: user._id }).catch((err) => {
      console.log(err);
      return next(createError(500, "Unabe to delete user"));
    });
    if (user) {
      res.status(200).json({ result: "delete success" });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.post("/mark-read", async (req, res, next) => {
  try {
    const notificationIds = req.body.notificationIds;
    for (let i = 0; i < notificationIds.length; i++) {
      await Notification.findByIdAndUpdate(notificationIds[i], {
        isUnRead: false,
      });
    }
    res.status(200)
    .json({ result: "Notifications mark as read success" });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.put("/", async (req, res, next) => {
  try {
    const result = await validateUpdateUser.validateAsync(
      {
        name: req.body.name,
        contact_number: req.body.contact_number,
      },
      { abortEarly: false }
    );

    if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    const token = req.headers["x-auth-token"];
    const payload = await verifyAccessToken(token);

    const user = await User.findOne({ _id: payload._id }).populate({
      path: "workerId",
      select: "is_verified",
    });
    if (!user) throw createError(404, "User not found");
    if (user.isBlocked) throw createError(401, "Blocked user");
    if (!user.isVerified)
      throw createError(401, "Unauthorized, not verifired account");

    user.name = result.name;
    user.contact_number = result.contact_number;
    await user.save().catch((err) => {
      createError(400, "Unable to save user");
    });
    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        contact_number: user.contact_number,
        recentSearches: user.recentSearches,
        isGoogleUser: user.isGoogleUser,
        isFacebookUser: user.isFacebookUser,
        isCustomUser: user.isCustomUser,
        isVerified: user.isVerified,
        isBlocked: user.isBlocked,
        forgotPassword: user.forgotPassword,
      },
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;
