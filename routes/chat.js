const express = require("express");
const router = express.Router();
// const authController = require("../controllers/auth");
// const homeController = require("../controllers/home");
const chatsController = require("../controllers/chats");
const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Chat Routes - simplified for now
router.get("/", chatsController.getLobby);
router.get("/room/:room", ensureAuth, chatsController.getRoom);


module.exports = router;
