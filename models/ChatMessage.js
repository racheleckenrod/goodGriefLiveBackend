const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true,
    },
    user: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }, {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GuestUserID",
        }],
        required: true,
      },
    message: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now(),
    },
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);