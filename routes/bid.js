const { Bid, validateBid } = require('../models/Bids');
const {
  userRequest,
  validateUserRequest,
} = require('../models/UserRequest');
const { User } = require('../models/Users');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const get_ip = require('ipware')().get_ip;
const cloudinary = require('cloudinary').v2;
const config = require('config');
const createError = require('http-errors');
const {
  signAccessToken,
  verifyAccessToken,
  signRefeshToken,
  verifyRefreshToken,
  verifyAccessTokens,
} = require('../helpers/jwt_helpers');
const { UserRequest } = require('../models/UserRequest');
const Notification = require('../models/Notification');

cloudinary.config({
  cloud_name: config.get('cloudinary_cloud_name'),
  api_key: config.get('cloudinary_api_key'),
  api_secret: config.get('cloudinary_api_secret'),
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

const upload = multer({ dest: 'uploads/' });

/**
 * @swagger
 * /api/bid:
 *  post:
 *    description: find users by area
 *    parameters:
 *      - name: body
 *        in: body
 *        description: asd
 *        required: true
 *        example:
 *            request_id: "string"
 *            info: "string"
 *            proposed_budget: "string"
 *            proposed_time: "string"
 *    security:
 *      - Bearer: []
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.post('/', async (req, res, next) => {
  try {
    console.log('********');
    console.log('********');
    console.log('********');
    if (!req.headers['x-auth-token'])
      return next(createError.Unauthorized());
    const token = req.headers['x-auth-token'];
    const payload = await verifyAccessToken(token);

    if (!payload) throw createError(401, 'Unauthorized');

    const result = await validateBid.validateAsync({
      info: req.body.info,
      proposed_budget: req.body.proposed_budget,
      proposed_time: req.body.proposed_time,
    });

    const user_request = await UserRequest.findOne({
      _id: req.body.request_id,
    });
    console.log(user_request);
    if (user_request.user_id.toString() === payload._id) {
      throw createError(409, 'Cant add bid on your own request');
    }

    const bid = new Bid({
      info: result.info,
      proposed_budget: result.proposed_budget,
      proposed_time: result.proposed_time,
      request_id: user_request._id,
      user_id: payload._id,
    });

    await bid.save();
    user_request.bids.push(bid._id);

    const user = await User.findById(payload._id);
    console.log(`user`, user);

    const notification = await Notification.create({
      title: 'New Bidding Request !',
      description: `Made By ${user.name}`,
      avatar: user.imageUrl,
      type: 'user_request',
      url: `/smurf-app/user-request/${user_request._id}`,
      userRequest_id: user_request._id
    });

    const user_request_owner = await User.findById(
      user_request.user_id
    );
    user_request_owner.notifications.push(notification._id);
    await user_request_owner.save();

    // * Send Real Time Notification
    const { io } = require('../index');
    io.sockets.emit('new_notification', {
      notification,
      userId: user_request_owner._id,
    });

    await user_request.save();
    res.send(user_request);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

/**
 * @swagger
 * /api/bid/{id}:
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
router.delete('/:id', async (req, res, next) => {
  try {
    if (!req.headers['x-auth-token'])
      return next(createError.Unauthorized());
    const token = req.headers['x-auth-token'];
    const payload = await verifyAccessToken(token);

    const user = await User.findOne({ _id: payload._id });
    if (!user) throw createError(404, 'User not found');
    if (user.isBlocked) throw createError(401, 'Blocked user');
    if (!user.isVerified)
      throw createError(401, 'Unauthorized, not verifired account');

    const bid = await Bid.findOne({
      _id: req.params.id,
      user_id: payload._id,
    });
    if (!bid) throw createError(404, 'Bid not found');

    await Bid.deleteOne({ _id: bid._id }).catch((err) => {
      console.log(err);
      createError('500', 'Unable to delete post');
    });

    res.status(200).json({ result: 'delete success' });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

/**
 * @swagger
 * /api/bid/request/{id}:
 *  get:
 *    description: only custom user, mail sent with verification code
 *    parameters:
 *      - name: id
 *        in: path
 *        description: id of user
 *        required: true
 *    responses:
 *      '200':
 *        description: A successful response
 */
router.get('/request/:id', async (req, res, next) => {
  try {
    const bids = await Bid.find({ request_id: req.params.id })
      .populate('user_id')
      .populate('request_id')
      .catch((err) => res.status(500).send('server error'));

    console.log(bids);

    res.status(200).send({ bids });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.post('/accept-cancel', async (req, res, next) => {
  try {
    const bid_id = req.body.bid_id;
    const user_id = req.body.user_id;
    const userRequest_id = req.body.userRequest_id;
    const status = req.body.status;

    const bid = await Bid.findByIdAndUpdate(bid_id, { status });

    const user = await User.findById(user_id);

    const notification = await Notification.create({
      title: 'Your bidding request got ' + status,
      description: `Made By ${user.name}`,
      avatar: user.imageUrl,
      type: 'user_request',
      url: `/user-request/${userRequest_id}`,
      userRequest_id
    });

    user.notifications.push(notification._id);
    await user.save();

    if (status == "Accepted") {
      const userRequest = await UserRequest.findById(userRequest_id);
      for (let i = 0; i < userRequest.bids.length; i++) {
        let bidId = userRequest.bids[i];
        if (bid_id != bidId) {
          await Bid.findByIdAndUpdate(bidId, { status: "Rejected" });
        }
      }
      await UserRequest.findByIdAndUpdate(userRequest_id, { isStopped: true });
    }

    res.status(200).send({ bid });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// end routes
// exports
module.exports = router;
