const { UserRequest, Bid, validateUserRequest } = require("../models/UserRequest");
const { User } = require("../models/Users");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const get_ip = require("ipware")().get_ip;
const cloudinary = require("cloudinary").v2;
const config = require("config");
const createError = require("http-errors");
const {
  signAccessToken,
  verifyAccessToken,
  signRefeshToken,
  verifyRefreshToken, 
  verifyAccessTokens,
} = require("../helpers/jwt_helpers");

cloudinary.config({
  cloud_name: config.get("cloudinary_cloud_name"),
  api_key: config.get("cloudinary_api_key"),
  api_secret: config.get("cloudinary_api_secret"),
});

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

const upload = multer({ dest: "uploads/", });

/**
 * @swagger
 * /api/UserRequest:
 *  post:
 *    consumes:
 *      - "multipart/form-data"
 *    parameters:
 *      - name: "info"
 *        in: formData
 *        description: post info
 *        type: string
 *      - name: "img"
 *        in: formData
 *        description: upload 1 picture
 *        type: file
 *      - name: "category_id"
 *        in: formData
 *        description: category id
 *        type: string
 *      - name: "subCategory_id"
 *        in: formData
 *        description: sub cat id
 *        type: string
 *    security:
 *      - Bearer: []
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.post("/", upload.single("img"), async (req, res, next) => {
  try {

    if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    const token = req.headers["x-auth-token"];
    const payload = await verifyAccessToken(token);
 
    const user = await User.findOne({ _id: payload._id });
    if (!user) throw createError(404, "User not found");
    if (user.isBlocked) throw createError(401, "Blocked user");
    if (!user.isVerified) 
      throw createError(401, "Unauthorized, not verifired account");
    console.log(req.body);

    const result = await validateUserRequest.validateAsync({
      info: req.body.info,
      category_id: req.body.category_id,
      subCategory_id: req.body.subCategory_id,
      budget: req.body.budget,
      proposedTimeLength: req.body.proposedTimeLength,
      skills: req.body.skills
    });
    
    const filePath = await cloudinary.uploader.upload(req.file.path);
    if (!filePath.secure_url) throw createError(500, "unable to upload image");

    const post = new UserRequest({
      user_id: user._id,
      info: result.info,
      postImage: filePath.secure_url,
      category_id: result.category_id,
      subCategory_id: result.subCategory_id,
      budget: result.budget,
      proposedTimeLength: result.proposedTimeLength,
      skills: result.skills
    }); 

    console.log(post);
    await post.save();
    res.status(200).json(post);
  } catch (err) { console.log(err); next(err); }
});

/**
 * @swagger
 * /api/UserRequest:
 *  post:
 *    consumes:
 *      - "multipart/form-data"
 *    parameters: 
 *      - name: "info"
 *        in: formData
 *        description: post info
 *        type: string
 *      - name: "img"
 *        in: formData
 *        description: upload 1 picture
 *        type: file
 *      - name: "category_id"
 *        in: formData
 *        description: category id
 *        type: string
 *      - name: "subCategory_id"
 *        in: formData
 *        description: sub cat id
 *        type: string
 *    security:
 *      - Bearer: []
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.post("/stop", async (req, res, next) => {
  try {

    if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    const token = req.headers["x-auth-token"];
    const payload = await verifyAccessToken(token);
 
    const user = await User.findOne({ _id: payload._id });
    if (!user) throw createError(404, "User not found");
    if (user.isBlocked) throw createError(401, "Blocked user");
    if (!user.isVerified) 
      throw createError(401, "Unauthorized, not verifired account");

    const user_request = await UserRequest.findOne({ _id: req.body.request_id, });
    user_request.isStopped = true;
    await user_request.save();

    console.log(user_request);
    res.status(200).json(user_request);
  } catch (err) { console.log(err); next(err); }
});

// /**
//  * @swagger
//  * /api/post/:
//  *  get:
//  *    description: get all posts
//  *    responses:
//  *      '200':
//  *        description: A successful response
//  */
// router.get("/", async (req, res, next) => {
//   try {
//     await Post.find()
//       .populate("industry_id", "name")
//       .populate("category_id", "name")
//       .populate("user_id", "name imageUrl")
//       .sort({ _id: -1 })
//       .then((posts) => res.status(200).json(posts))
//       .catch((err) => {
//         throw createError("500", "Server error, unable to get psot");
//       });
//   } catch (err) {
//     console.log(err);
//     next(err);
//   }
// });

/**  
 * @swagger
 * /api/UserRequest/:
 *  get:
 *    description: get all posts
 *    parameters:
 *      - name: pageNumber
 *        in: query
 *        description: pagenumber
 *      - name: pageSize 
 *        in: query
 *        description: pageSize
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.get("/all", async (req, res, next) => {
  try {
    const pageNumber = parseInt(req.query.pageNumber);
    const pageSize = parseInt(req.query.pageSize);
    const count = await UserRequest.find()
      .countDocuments() 
      .catch((err) => {
        throw createError(500, "post error");
      });
    const userRequest = await UserRequest.find()
      .populate("category_id", "name")
      .populate("subCategory_id", "name")
      .populate("user_id", "name imageUrl")
      // .populate({ 
      //   path: "bids",
      //   populate: {
      //     path: "user_id",
      //     model: "User",
      //     select: "name -id"
      //   },
      // })
      .sort({ _id: -1 })
      .skip((pageNumber - 1) * pageSize) 
      .limit(pageSize)
      .catch((err) => {
        throw createError(500, "Server error, unable to get psot");
      });
    res.json({ count, pageNumber, pageSize, userRequest });
  } catch (err) {
    console.log(err);
    next(err);
  }
});


/**  
 * @swagger
 * /api/UserRequest/single/{id}:
 *  get:
 *    description: get all posts
 *    parameters:
 *      - name: pageNumber
 *        in: query
 *        description: pagenumber
 *      - name: pageSize 
 *        in: query
 *        description: pageSize
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.get("/single/:id", async (req, res, next) => {
  try {
    const userRequest = await UserRequest.findOne({ _id: req.params.id })
      .populate("category_id", "name")
      .populate("subCategory_id", "name")
      .populate("user_id", "name imageUrl contact_number")
      .populate("bids")
      // .populate({ 
      //   path: "bids",
      //   populate: {
      //     path: "user_id",
      //     model: "User",
      //     select: "name -id"
      //   },
      // })
      .catch((err) => {
        throw createError(500, "Server error, unable to get psot");
      });
    res.json({ userRequest });
  } catch (err) {
    console.log(err);
    next(err);
  }
});




/**
 * @swagger
 * /api/UserRequest/user-posts/{id}:
 *  get:
 *    description: get all posts
 *    parameters:
 *      - name: id
 *        in: path
 *        description: user id
 *      - name: pageNumber
 *        in: query
 *        description: pagenumber
 *      - name: pageSize
 *        in: query
 *        description: pageSize
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.get("/user-posts/:id", async (req, res, next) => {
  try {
    const pageNumber = parseInt(req.query.pageNumber);
    const pageSize = parseInt(req.query.pageSize);
    const count = await UserRequest.find({ user_id: req.params.id })
      .countDocuments()
      .catch((err) => {
        throw createError(500, "post error");
      });
    const posts = await UserRequest.find({ user_id: req.params.id })
      .populate("industry_id", "name")
      .populate("category_id", "name")
      .populate("user_id", "name imageUrl")
      .select("-report_count")
      .sort({ _id: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .catch((err) => {
        throw createError("500", "Server error, unable to get psot");
      });
    res.json({ count, pageNumber, pageSize, posts });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

/**
 * @swagger
 * /api/UserRequest/{id}:
 *  delete:
 *    description: delete post
 *    parameters:
 *      - name: id
 *        in: path
 *        description: id of post
 *        required: true
 *    security:
 *      - Bearer: []
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.delete("/:id", async (req, res, next) => {
  try {
    if (!req.headers["x-auth-token"]) return next(createError.Unauthorized());
    const token = req.headers["x-auth-token"];
    const payload = await verifyAccessToken(token);

    const user = await User.findOne({ _id: payload._id });
    if (!user) throw createError(404, "User not found");
    if (user.isBlocked) throw createError(401, "Blocked user");
    if (!user.isVerified)
      throw createError(401, "Unauthorized, not verifired account");

    const post = await UserRequest.findOne({
      _id: req.params.id,
      user_id: payload._id,
    });
    if (!post) throw createError(404, "User requset not found");

    await UserRequest.deleteOne({ _id: post._id }).catch((err) => {
      console.log(err);
      createError("500", "Unable to delete post");
    });

    res.status(200).json({ result: "delete success" });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// end routes
// exports
module.exports = router;
 