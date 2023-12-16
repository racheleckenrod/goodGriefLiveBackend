const passport = require("passport");
const validator = require("validator");
const User = require("../models/User");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
// const { link } = require("fs");


  // Create a Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });



exports.getSignup = (req, res) => {
  if (req.user) {
    return res.redirect("/welcome");
  }
  res.render("signup", {
    title: "Create Account",
    user: req.user,
  });
};

exports.postSignup = (req, res, next) => {
  console.log("calling exports.postSignup")
  const validationErrors = [];
  
  if (!validator.isEmail(req.body.email))
    validationErrors.push({ msg: "Please enter a valid email address." });
  if (!validator.isLength(req.body.password, { min: 8 }))
    validationErrors.push({
      msg: "Password must be at least 8 characters long",
    });
  if (req.body.password !== req.body.confirmPassword)
    validationErrors.push({ msg: "Passwords do not match" });

  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("../signup");
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false,
  });

  const user = new User({
    userName: req.body.userName,
    email: req.body.email,
    password: req.body.password,
    timezone: req.session.userTimeZone,
    userLang: req.session.userLang,
    guestIDs: [req.session.guestID],
  });

  User.findOne(
    { $or: [{ email: req.body.email }, { userName: req.body.userName }] },
    (err, existingUser) => {
      if (err) {
        return next(err);
      }
      if (existingUser) {
        req.flash("errors", {
          msg: "Account with that email address or username already exists.",
        });
        return res.redirect("../signup");
      }
      user.save((err) => {
        if (err) {
          return next(err);
        }
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }

                    // Send an email notification to yourself
            const emailOptions = {
              from: process.env.EMAIL_USER,
              to: ['rachel@racheleckenrod.com', 'backintobalance@gmail.com', 'goodgrieflive@gmail.com'], 
              subject: 'A New User Signed Up for Good Greif Live',
              text: `A new user has signed up:\n\nUsername: ${user.userName}\nEmail: ${user.email}`,
            };

            transporter.sendMail(emailOptions, (error) => {
              if (error) {
                console.error('Error sending new user notification email:', error);
              } else {
                console.log('New user notification email sent successfully.');
              }
            });

            res.redirect("/welcome");
        });
      });
    }
  );
};


exports.getLogin = (req, res) => {
  console.log("req.user.userName=", req.user ? req.user.userName : "no req.user", "from getLogin", req.session)
  res.render("login");
};


exports.postLogin = async (req, res, next) => {
  console.log("from postLogin", req.session.userTimeZone, req.session.guestID, req.session.userLang);
  const guestID = req.session.guestID;
  const userLang = req.session.userLang;
  const userTimeZone = req.session.userTimeZone;
  // const userID = req.session.user._id;
  console.log(guestID);
  
  const validationErrors = [];
  
  if (!validator.isEmail(req.body.email))
    validationErrors.push({ msg: "Please enter a valid email address." });
  if (validator.isEmpty(req.body.password))
    validationErrors.push({ msg: "Password cannot be blank." });

  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/login");
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false,
  });

  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash("errors", info);
      return res.redirect("/login");
    }
    
    req.logIn(user, async (err) => {
      if (err) {
        return next(err);
      }
      
      req.flash("success", { msg: "Success! You are logged in." });


      if (userTimeZone != null && userLang != null && guestID != null) {
          try {
          const user = await User.updateOne({ email: req.body.email },
            { $addToSet: {guestIDs: guestID },
              $set: { timezone: userTimeZone, userLang: userLang }
            });   
          } catch (err) {
          return next(err);
          }
        console.log("updated user in database on login.");
      } else if (guestID != null) {
          try {
            const user = await User.updateOne({ email: req.body.email },
              { $addToSet: {guestIDs: guestID }
              });   
          } catch (err) {
            return next(err);
          }
          console.log("updated guestID only in database on login.");
      } else {
        console.log("all user data is not available, skipping update.")
      }
      
      console.log("FROM LOGIN", req.session)


      res.status(200).json({
        success: true,
        message: 'Login successful',
        session: req.session,
        user: req.user,
      })


        });
  })(req, res, next);
};


exports.getPasswordResetRequest = (req, res) => {
  res.status(200).json({  
    success: "Working out all the kinks...",
    session: req.session,
    userName: req.session.userName,
  });
}



exports.postPasswordResetRequest = async (req, res) => {
  const validationErrors = [];
  
  if (!validator.isEmail(req.body.email))
    validationErrors.push({ msg: "Please enter a valid email address." });
  if (validator.isEmpty(req.body.email))
    validationErrors.push({ msg: "Email cannot be blank." });

  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.status(500).json({ error: validationErrors[0] });
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false,
  });
  try {
    // check if it is an email
    const { email } = req.body;
    if (!email) {
      req.flash('errors', 'Email is definitely required.');
      return res.status(502).json({ message: "no email"})
    }

    // check if the email is a user in the database
    const user = await User.findOne({ email });

    if (!user) {
      req.flash('errors', 'No such User found with that email address.');
      return res.status(404).json({ message: "No such user found with that email address."})
    }

    // generate unique reset token with expiration
    const token = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; //token expires in one hour

        
    // save user with the token and send email    
    await user.save();
    console.log("saving USER", user.resetPasswordToken)
          

    // send an email to the user with a link containing the token
    const resetLink = `http://localhost:5173/passwordReset/${token}`;
              

                

    // send the reset link in the email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `Hello ${user.userName}, \n\nWe are glad to have you in our community. You can click on the following link to reset your password: ${resetLink}. \nIt's valid for one hour. \n\nPlease let us know if you have any other trouble by sending us an email, or submitting the form at the bottom of the website. We hope you are finding support and enjoy connecting with others. \nThank you and talk to you soon!  \n\n Good Grief Live`,
    };

                  
    transporter.sendMail(mailOptions, (emailError) => {
      if (emailError) {
        console.error("Error sending password reset email", emailError);
        req.flash('errors', 'Error sending password reset email.');
        return res.staus(500).json({message: 'Error sending password reset email.' });
      } else {

        // Email sent successfully
        console.log("Password reset email sent.")
        
        // redirect to confimation page
        // req.flash("success", { msg: "Success! You are logged in." });
        req.flash('success', { msg: 'Password reset request was successful! Please check your email for further instructions.' });

        // res.json({ success: true, message: 'Password reset request was successful! Please check your email for further instructions.'})
        res.status(200).json({
          success: "Password reset email sent successful!" 
        });     
      }  
    });     
  } catch (error) {
    // handle unexpected errors
    console.error(error);
    req.flash("errors", "An unexpected error occurred.");
    res.status(500).json({ error: 'An unauthorized error occurred.'});
  }
};


exports.getPasswordReset = async (req, res) => {
  try {
    // Extract token from URL
    const resetToken = req.params.token;
    if(typeof resetToken === 'string') console.log("STRINGGG") 
    if(typeof resetToken === 'number') console.log("NUMBERRRR")
    console.log("RESET TOKEN=",resetToken)
    // Query database to find user with that token
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      // resetPasswordExpires: { $gt: Date.now() },
      
    }).catch((error) => {
      console.error('%^%^%^%^%^%^%%^%%^%^%^%^%error querying the database:', error);
      return res.status(500).json({ error: 'Internal server error in the database' });

    });
    console.log("TEMPORARY")

      console.log("user=", user)

    if (!user) {
      // if no token or it is expired
      req.flash('errors', 'Invalid or expired password reset link.');
      return res.status(404).json({ error: "no user"})
    }

    // render reset page with user data
    res.status(200).json({
      user: user,
      title: "Password Reset",
      email: user.email,
      userName: user.userName
     });

  } catch (error) {
    console.error(error);
    req.flash('errors', 'An unexpected error occurred.');
    res.status(500).json({message: "errors"})
  }
  
};



// router.post("/passwordResetConfirmation", authController.postPasswordResetConfirmation);
exports.postPasswordUpdate = async (req, res) => {
  console.log("postPasswordUpdate", req.params.token)
  const resetToken = req.params.token;

  try {
    const { newPassword, confirmPassword } = req.body;
    // console.log(newPassword, confirmPassword)
    if (newPassword !== confirmPassword) {
      req.flash('errors', 'Passwords do not match.');
      return res.redirect(`/passwordReset/${resetToken}`);
    }

    // const user = await User.findById(req.user.id);
    // Query database to find user with that token
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      // resetPasswordExpires: { $gt: Date.now() },
      
    });


    console.log("user==", user)

    if (!user) {
      req.flash('errors', 'User not found.');
      return res.redirect(`passwordReset/${resetToken}`);
    }

    user.password = newPassword;
    user.resetPasswordExpires = Date.now(0);

    await user.save();

    req.flash('success', { msg: 'Password updated successfully!'});
    req.flash('success', { msg: 'You may now login'});

    res.redirect('/login');

  } catch (error) {
    console.error(error);
    req.flash('errors', 'An unexpected error occured.');
    res.redirect(`/passwordResetRequest`);
  }
  
};

exports.postFeedback = (req, res, next) => {
  console.log("exports.postFeedback")
  const validationErrors = [];
  if (!validator.isEmail(req.body.email))
    validationErrors.push({ msg: "Please enter a valid email address." });

  if (!validator.isLength(req.body.userName, { min: 1 }))
  validationErrors.push({
    msg: "Please enter your name.",
  });

  if (validationErrors.length) {
    req.flash("errors", validationErrors);
    return res.redirect("/#footer");
  }
  req.body.email = validator.normalizeEmail(req.body.email, {
    gmail_remove_dots: false,
  });

};

// exports.logout = (req, res) => {
//   const username = "unknown" || req.user.userName
//   req.logout(() => {
//     console.log(`User ${username} has logged out.`)
//   })
//   req.session.destroy((err) => {
//     if (err)
//       console.log("Error : Failed to destroy the session during logout.", err);
//     req.user = null;
//     res.status(500).json({});
//   });
// };


exports.logout = (req, res) => {
  const username = req.user ? req.user.userName : (req.guestUser ? req.guestUser.userName : "unknown");
  req.logout(() => {
    console.log(`User ${username} has logged out.`)
  })
  req.session.destroy((err) => {
    if (err){
      console.log("Error : Failed to destroy the session during logout.", err);
    }
    req.user = null;
    res.status(200).json({ message: "logout successful" });
  });
};
