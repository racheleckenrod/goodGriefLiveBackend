const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  greeting: { type: String, default: "We can honor our dead by living our best lives." },
  profilePicture: { type: String, default: "https://source.unsplash.com/random/?flowers"},
  about: { type: String, default: "Please use this space to tell us a little bit about yourself. We would love to know why you are here, who or what you are grieving, helpful ways you have found to express your grief, as well as whatever else you would like to share."},
  story: { type: String, default: "There is space here for you to tell your story. You can update or add to it as you like."},
  viewUser: { type: Boolean, default: true},
  timezone: { type: String, default: "UTC"},
  userLang: { type: String, default: "default"},
  guestIDs: { type: [String], default: [] },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

// Password hash middleware.

UserSchema.pre("save", function save(next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

// Helper method for validating user's password.

UserSchema.methods.comparePassword = function comparePassword(
  candidatePassword,
  cb
) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

module.exports = mongoose.model("User", UserSchema);
