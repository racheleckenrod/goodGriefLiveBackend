const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Guest = require("../models/Guest");
const Feedback = require("../models/Feedback");
const validator = require("validator");
const nodemailer = require('nodemailer');

// create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// function to send email notification
const sendEmailNotification = async (feedback, recipients) => {
  const mailOptions = {
    from: 'goodgrieflive@gmail.com',
    to: recipients.join(', '),
    subject: 'New Feedback Received',
    text: `New feedback received:\n\n${JSON.stringify(feedback, null, 2)}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email notification sent:', mailOptions);
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
};


module.exports = {
    getIndex: async (req, res) => {
      try {
        let data;
        // let userName;
        if (!req.user) {
          const _id = req.session._id
          const posts = await Post.find().populate('user').sort({ likes: "desc" }).lean();
          const comments = await Comment.find().sort({ createdAt: "asc" }).lean()
          data = { posts: posts, comments: comments, userName: req.session.userName, _id: _id, session: req.session };
        } else {
          const _id = req.user._id
          const posts = await Post.find().populate('user').sort({ likes: "desc" }).lean();
          const comments = await Comment.find().sort({ createdAt: "asc" }).lean()
          data = { posts: posts, comments: comments,  user: req.user, userName: req.user.userName, _id: _id, session: req.session };
        }
        res.json(data);
        
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    },
  
    getWelcome: async (req, res) => {
      try{
        const posts = await Post.find({ user: req.user.id }).populate('user');
        const likedPosts = await Post.find({ user: req.user.id }).sort({likes: "desc"}).lean();
        const comments = await Comment.find().sort({ createdAt: "asc" }).lean()
        const _id = req.user._id
        // console.log(likedPosts, "likedPosts from getWelcome")
        res.status(200).json({ posts: posts, comments: comments, user: req.user, userName: req.user.userName, _id: _id, likedPosts: likedPosts });
      }catch (err) {
        console.log(err)
      }

    },
    postFeedback: async (req, res, next) => {
      const validationErrors = [];
    
      if (!validator.isEmail(req.body.email))
        validationErrors.push({ msg: "Please enter a valid email address." });
    
      if (!validator.isLength(req.body.inputName, { min: 1 }))
        validationErrors.push({
          msg: "Please enter a name.",
        });

        req.session.returnTo = req.headers.referer || '/';
    
      if (validationErrors.length) {
        req.flash("errors", validationErrors);

        const redirectURL = req.session.returnTo || '/';
        return res.redirect(`${redirectURL}#footer`);
      }
    
      req.body.email = validator.normalizeEmail(req.body.email, {
        gmail_remove_dots: false,
      });
    
      try {
        let feedback;
    
        if (req.user) {
          // Handle user feedback
          feedback = await Feedback.create({
            user: req.user.id,
            inputName: req.body.inputName,
            email: req.body.email,
            message: req.body.message,
            userName: req.user.userName,
          });
        } else {
          // Handle guest feedback
          const existingGuest = await Guest.findOne({
            _id: req.session.guestUser._id,
          });
    
          if (existingGuest) {
            // Use the existing guest for feedback
            feedback = await Feedback.create({
              guest: existingGuest._id,
              inputName: req.body.inputName, // Adjust this based on your schema
              email: req.body.email,
              message: req.body.message,
              userName: req.session.guestUser.userName,
            });
          } else {
            // No need to explicitly create a new guest; it's handled by your schema
            feedback = await Feedback.create({
              email: req.body.email,
              message: req.body.message,
              userName: req.body.userName,
            });
          }
        }
    
        console.log("Feedback has been added!");
        req.flash("info", {
          msg: `Your message was sent. Thank you, ${
            req.user ? req.user.userName : req.body.inputName
          }, for your feedback!`,
        });
        try {
          const recipients = ['backintobalance@gmail.com', 'rachel@racheleckenrod.com', 'goodgrieflive@gmail.com'];
          await sendEmailNotification(feedback, recipients);

        } catch (err) {
          console.error(err, 'from home controller postfeedback multiple emails');
          return next(err);
        }

        const redirectURL = req.session.returnTo || '/';
        delete req.session.returnTo;
        return res.redirect(`${redirectURL}#footer`);
      } catch (err) {
        console.error(err, "from home controller postFeedback");
        return next(err);
      }
    },
    

    getPrivacyPolicy: (req, res) => {
      res.json({ message: "privacyPolicy" });
    },

    removeCookies: async (req, res) => {
      try {
          // Asynchronously destroy the session
      await new Promise((resolve, reject) => {
          req.session.destroy((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        res.clearCookie('consentCookie');
        res.clearCookie('guestID');
        res.clearCookie('rulesCookie');
        res.clearCookie('connect.sid', { path: '/' }); // Specify the path for session cookie
        res.status(200).json({ message: "Cookies successfully removed, have a nice day."});
      } catch (error) {
          console.error('Error destroying session:', error);

          res.status(500).send("Internal Server Error")
      }
      
    },

    };
      