const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const authController = require("../controllers/auth");
const homeController = require("../controllers/home");
const postsController = require("../controllers/posts");
const { ensureAuth, ensureGuest, ensureFeedback } = require("../middleware/auth");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const formatMessage = require("../utils/messages");
const botName = "Server says";
// const { userTimeZone, userLang } = require("../public/js/shared.js");
// const { io } = require('../server');

module.exports = function (io) {


//Main Routes - simplified for now
router.get("/", homeController.getIndex);
router.get("/privacyPolicy", homeController.getPrivacyPolicy);
router.get("/removeCookies", homeController.removeCookies);

router.post("/feedback", homeController.postFeedback)
router.get("/profile/:id", ensureAuth,postsController.showProfile);
router.get("/profile", ensureAuth, postsController.getProfile);
router.get("/editProfile", ensureAuth, postsController.getEditProfile);
router.put("/editProfile/:id", ensureAuth, postsController.editProfile)
router.put("/profilePicture/:id", ensureAuth, upload.single("file"), postsController.editProfilePic);


router.get("/welcome", ensureAuth, homeController.getWelcome);
router.get("/feed", ensureAuth, postsController.getFeed);
// router.get("/testFeed", ensureAuth, postsController.getTestFeed);

router.get("/passwordResetRequest", authController.getPasswordResetRequest);
router.post("/passwordResetRequest", authController.postPasswordResetRequest);
router.get("/passwordReset/:token", authController.getPasswordReset);
router.get("/passwordReset", authController.getPasswordReset);

router.post("/passwordUpdate/:token", authController.postPasswordUpdate);

// router.get("/login", authController.getLogin);
router.get("/login", (req, res) => {
    // console.log("first login message");
    // if (req.user) {
    // console.log("message from the login route");
    // req.app.io.emit('tx',  formatMessage(botName, `${req.user.userName} is logging in.`,  req.session.userTimeZone, req.session.userLang));
    // console.log("after emitting")
    // authController.getLogin(req, res);
    // } else {
        console.log("else first login");
        authController.getLogin(req, res);
        console.log("else second login")
    // }
        // res.redirect('/login');
});
router.post("/login", authController.postLogin, () => {console.log("post Route")});

router.get("/logout", (req, res) => {
    console.log("logpout router");
    let username;
    if (req.user) {
        username = req.user.userName;
    } else {
        username = req.session.guestUser.userName;
    }
    req.app.io.emit('loggedOut', formatMessage(botName, `${username} logged out.`));
 authController.logout(req, res);
});

router.get("/signup", authController.getSignup);
router.post("/signup", authController.postSignup);

    return router;
};
