const { Worker, validateWorker } = require("../models/Worker");
const { User } = require("../models/Users");
const { Admin } = require("../models/Admins");
const express = require("express");
const router = express.Router();
const config = require("config");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Notification = require("../models/Notification");

const {
  signAccessToken,
  verifyAccessToken,
  signRefeshToken,
  verifyRefreshToken,
  verifyAccessTokens,
} = require("../helpers/jwt_helpers");
const { adminVerifyAccessToken } = require("../helpers/jwt_helpers_admin");

const createError = require("http-errors");

cloudinary.config({
  cloud_name: config.get("cloudinary_cloud_name"),
  api_key: config.get("cloudinary_api_key"),
  api_secret: config.get("cloudinary_api_secret"),
});

const cloudinaryImageUploadMethod = async (file) => {
  return new Promise((resolve) => {
    cloudinary.uploader.upload(file, (err, res) => {
      if (err) return res.status(500).send("upload image error");
      console.log(res.secure_url);
      resolve({
        res: res.secure_url,
      });
    });
  });
};

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },
//   filename: function (req, file, cb) {
//     cb(null, new Date().toISOString() + " $ " + file.originalname);
//   },
// });
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
//     cb(null, true);
//   } else {
//     cb(new Error("not a image"), false);
//   }
// };
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 1024 * 1024 * 5 }, //max file size 5MB
//   fileFilter: fileFilter,
// });

const upload = multer({ dest: "uploads/" });

router.post("/", upload.array("picture", 2), async (req, res, next) => {
  try {
    console.log("here");
    const result = await validateWorker.validateAsync({
      contact_number: req.body.contact_number,
      secondary_contact_number: req.body.secondary_contact_number,
      whatsapp_number: req.body.whatsapp_number,
      area: req.body.area,
      city: req.body.city,
      category_id: req.body.category_id,
      subCategory_id: req.body.subCategory_id,
      bio: req.body.bio,
      hourly_rate: req.body.hourly_rate,
      daily_rate: req.body.daily_rate,
      weekly_rate: req.body.weekly_rate,
      age: req.body.age,
      experience: req.body.experience,
      education: req.body.education,
      cnic_no: req.body.cnic_no,
    });
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
    if (user.isWorker) {
      throw createError(400, "Already a worker");
    }

    console.log(req.files);
    const urls = [];
    const files = req.files;
    for (const file of files) {
      const { path } = file;
      const newPath = await cloudinaryImageUploadMethod(path);
      urls.push(newPath);
    }

    const worker = new Worker({
      u_id: payload._id,
      name: result.name,
      contact_number: result.contact_number,
      secondary_contact_number: result.secondary_contact_number,
      whatsapp_number: result.whatsapp_number,
      email: result.email,
      cellno: result.cellno,
      area: result.area,
      city: result.city,
      url: result.url,
      date: result.date,
      experience: result.experience,
      timings: result.timings,
      hourly_rate: result.hourly_rate,
      weekly_rate: result.weekly_rate,
      cnic_no: result.cnic_no,
      daily_rate: result.daily_rate,
      age: result.age,
      education: result.education,
      category_id: result.category_id,
      subCategory_id: result.subCategory_id,
      bio: result.bio,
      picture: urls[0] === undefined ? "temp" : urls[0].res,
      cnic_pic: urls[1] === undefined ? "temp" : urls[1].res,
      is_verified: false,
    });
    await worker.save();
    console.log(user);
    user.workerId = worker._id;
    user.isWorker = true;
    console.log(user);
    await user.save();
    res.send(worker);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.get("/all", async (req, res, next) => {
  try {
    const pageNumber = parseInt(req.query.pageNumber);
    const pageSize = parseInt(req.query.pageSize);
    const count = await Worker.find()
      .countDocuments()
      .catch((err) => {
        throw createError(500, "post error");
      });
    const workers = await Worker.find({ is_verified: true })
      .populate("category_id", "name")
      .populate("subCategory_id", "name")
      .populate("u_id", "name imageUrl")
      .populate("city", "name")
      .populate("area", "name")
      .populate("rating")
      .sort({ _id: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .catch((err) => {
        throw createError(500, "Server error, unable to get psot");
      });
    res.status(200).json({ count, pageNumber, pageSize, workers });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.get("/not-verified", async (req, res, next) => {
  try {
    const workers = await Worker.find({ is_verified: false })
      .populate("category_id", "name")
      .populate("subCategory_id", "name")
      .populate("u_id", "name imageUrl email")
      .populate("city", "name")
      .populate("area", "name")
      .catch((err) => {
        throw createError(500, "Server error, unable to get psot");
      });
    res.status(200).json(workers);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.get("/verified", async (req, res, next) => {
  try {
    const workers = await Worker.find()
      .populate("category_id", "name")
      .populate("subCategory_id", "name")
      .populate("u_id", "name imageUrl email")
      .populate("city", "name")
      .populate("area", "name")
      .catch((err) => {
        throw createError(500, "Server error, unable to get psot");
      });
    res.status(200).json({ workers });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.get("/home-page", async (req, res, next) => {
  try {
    const workers = await Worker.find({ is_verified: true })
      .populate("category_id", "name")
      .populate("subCategory_id", "name")
      .populate("u_id", "name imageUrl")
      .populate("city", "name")
      .populate("area", "name")
      .populate("rating")
      .sort({ _id: -1 })
      .limit(6)
      .catch((err) => {
        throw createError(500, "Server error, unable to get psot");
      });
    res.status(200).json({ workers });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.get("/single/:id", async (req, res, next) => {
  try {
    await Worker.findOne({ _id: req.params.id })
      .populate("category_id", "name")
      .populate("subCategory_id", "name")
      .populate("u_id", "name imageUrl")
      .populate("city", "name")
      .populate("area", "name")
      .populate({
        path: "rating",
        populate: {
          path: "user_id",
          model: "User",
          select: "name",
        },
      })
      .then((worker) => res.status(200).json(worker))
      .catch((err) => res.status(500).send("server error"));
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.get("/home", async (req, res, next) => {
  try {
    console.log("here");
    const workers = await Worker.find()
      .populate("category_id", "name")
      .populate("subCategory_id", "name")
      .populate("u_id", "name imageUrl")
      .populate("city", "name")
      .populate("area", "name")
      .populate("rating")
      .sort({ _id: -1 })
      .limit(3)
      .catch((err) => {
        console.log(err);
        throw createError(500, "Server error, unable to get psot");
      });
    res.status(200).json({ workers });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.get("/self", async (req, res, next) => {
  try {
    res.send("here");
    // if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    // const token = req.headers["x-auth-token"];
    // const payload = await verifyAccessToken(token);

    // const user = await User.findOne({ _id: payload._id });
    // if (!user) throw createError(404, "User not found");
    // if (user.isBlocked) throw createError(401, "Blocked user");
    // if (!user.isVerified)
    //   throw createError(401, "Unauthorized, not verifired account");
    // if (user.forgotPassword)
    //   throw createError(401, "Unauthorized, check email");
    // if (!user.isWorker) {
    //   throw createError(400, "Not a worker");
    // }

    // await Worker.findOne({ user_id: payload_id })
    //   .then((worker) => res.send(worker))
    //   .catch((err) => res.status(500).send(err));
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    let worker = Worker.findOne({
      _id: req.params.id,
      u_id: req.user._id,
    });
    if (!worker)
      return res
        .status(404)
        .send("The worker with the given ID was not found.");
    worker = await Worker.updateOne(
      { _id: req.params.id },
      {
        $set: {
          u_id: req.user._id,
          name: req.body.name,
          contact_number: req.body.contact_number,
          email: req.body.email,
          contact_number: req.body.contact_number,
          cellno: req.body.cellno,
          area: req.body.area,
          city: req.body.city,
          url: req.body.url,
          date: req.body.date,
          experience: req.body.experience,
          timings: req.body.timings,
          hourly_rate: req.body.hourly_rate,
          picture: req.body.picture,
          cnic_pic: req.body.cnic_pic,
          daily_rate: req.body.daily_rate,
          age: req.body.age,
          education: req.body.education,
          category: req.body.category,
          subCategory: req.body.subCategory,
          bio: req.body.bio,
          cnic_pic: req.body.bio,
          is_verified: req.body.is_verified,
        },
      }
    );
    res.send(business);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;

router.post("/verify", async (req, res, next) => {
  try {
    if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    const token = req.headers["x-auth-token"];
    const payload = await adminVerifyAccessToken(token);

    const admin = await Admin.findOne({ _id: payload._id });
    if (!admin)
      throw createError(403, "You are NOT Allowed to perform this action");

    const worker = await Worker.findOne({ _id: req.body.worker_id });
    worker["is_verified"] = true;
    // * Create Verify Notification
    const notification = await Notification.create({
      title: "You are Verified as Worker",
      description: `You can now use this app as worker`,
      avatar: worker.imageUrl,
      type: "mail",
      url: `/FREELANCERWORKPLACE`,
    });

    // * Send Real Time Notification
    const { io } = require("../index");
    io.sockets.emit("new_notification", {
      notification,
      userId: worker._id,
    });

    const currentUser = await User.findById(worker.u_id);
    currentUser.notifications.push(notification._id);
    console.log("currentUser :>> ", currentUser);
    console.log("notification :>> ", notification);

    await currentUser.save();

    await worker.save();
    res.status(200).send("ok");
  } catch (err) {
    console.log(err);
    next(err);
  }
});
