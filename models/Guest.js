const mongoose = require("mongoose");

const GuestSchema = new mongoose.Schema({
    guestUserID: { type: String, required: true, unique: true },
    userName: { type: String, unique: true },
    timezone: { type: String, default: 'UTC' },
    userLang: { type: String, default: 'en-US'},
    createdAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: { type: Date},
  
  });

  module.exports = mongoose.model("Guest", GuestSchema);