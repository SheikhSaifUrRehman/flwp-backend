const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Plz provide Notification title'],
  },
  description: {
    type: String,
    required: [true, 'Plz provide Notification description'],
  },
  avatar: {
    type: String,
  },
  type: {
    type: String,
    required: [true, 'Plz provide Notification Type'],
    enum: ['mail', 'chat_message', 'user_request'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isUnRead: {
    type: Boolean,
    default: true,
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
  },
  userRequest_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserRequest"
  },
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
