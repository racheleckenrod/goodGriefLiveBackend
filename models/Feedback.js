const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
    guest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Guest",
        required: false,
    },
    userName: {
        type: String,
        required: true,
    },
    inputName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    message: {
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });
  
  module.exports = mongoose.model("Feedback", FeedbackSchema);