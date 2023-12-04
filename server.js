const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  pingInterval: 25000,
  pingTimeout: 60000,
});
const socketIoCookie = require("socket.io-cookie")
const cors = require('cors');
require("dotenv").config({ path: "./config/.env" });
const PORT = process.env.PORT;

app.use(cors({ credentials: true, origin: 'http://localhost:5173' }));

// const moment = require('moment-timezone');
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const expressSocketIoSession = require("express-socket.io-session");
const methodOverride = require("method-override");
const flash = require("express-flash");
const logger = require("morgan");
const cookieParser = require('cookie-parser');
const connectDB = require("./config/database");
const nodemailer = require("nodemailer");
// const consentRoutes = require("./routes/consent");
const mainRoutes = require("./routes/main")(io);
const postRoutes = require("./routes/posts");
const commentRoutes = require("./routes/comments");
const chatRoutes = require("./routes/chat");
const Guest = require("./models/Guest");
const generateGuestID = require("./utils/guestUserIDs");
const formatMessage = require("./utils/messages");

const ChatMessage = require('./models/ChatMessage');
const User = require("./models/User");

const chatUsers = [];
const botName = "Grief Support Bot";


//Using EJS for views
app.set("view engine", "ejs");

app.set('socketio', io);
app.io = io;


//Use .env file in config folder
require("dotenv").config({ path: "./config/.env" });

//Static Folder
app.use(express.static(path.join(__dirname, "public")));
// server.use(express.static("public"))

//Logging
app.use(logger("dev"));


//Body Parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// cookies
app.use(cookieParser());

// const {
//   userJoin,
//   getCurrentUser,
//   userLeave,
//   getRoomUsers,
//   getAllUsers,
// } = require("./utils/users");

// obtain consent for cookies before setting session cookie and others
app.use((req, res, next) => {
  console.log("app.use test at the cookie level")
  const consentCookie = req.cookies.consentCookie;
  // console.log(req.path)

  if (req.path === '/privacyPolicy') {
    // return res.render("privacyPolicy");
    console.log("privacy policy")
    return next();
  }

  if (!consentCookie) {
    console.log("no consentCookie");
    // res.redirect('X-Redirect', '/');
    return res.status(401).json({ error: 'You must accept cookies.'});
  } 
  
  next();

});



// new setup using sessionMiddleware for socket.io:
const sessionMiddleware = session({
  secret: "goPackers",
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
})


// Passport config
require("./config/passport")(passport);

//Connect To Database
connectDB();




//Use forms for put / delete
app.use(methodOverride("_method"));

// continued set up of sessions with the sessionMiddleware:
app.use(sessionMiddleware)

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());


//Use flash messages for errors, info, ect...
app.use(flash());


// create guestUserID for guests
app.use( async (req, res, next) => {
// console.log("app.use test")
  if (req.isAuthenticated()) {
    req.session.status = 'loggedIn';
  } else {
    req.session.status = 'guest'
    const guestIDCookie = req.cookies.guestID;
    if (guestIDCookie) {
      const guestUser = await Guest.findOne({ guestUserID: guestIDCookie });
      if (guestUser) {
        req.session.guestUser = guestUser;
        req.session.userName = guestUser.userName;
        req.session._id = guestUser._id
      }
    }
  }

  console.log("app.use", req.session.status, "req.user=", req.user ? req.user.userName : 'none');
  next();
})

// Check for cookie acceptance before wrap middleware
io.use(async (socket, next) => {
  // console.log("io.use cookie check", socket.handshake.headers, socket.id)
  // Check for cookie acceptance
  const consentCookie = socket.handshake.headers.cookie
    ? socket.handshake.headers.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('consentCookie='))
    : undefined;
console.log("io consentCookie=", consentCookie)
  if (!consentCookie) {
    // No cookie acceptance, reject the connection
    return next(new Error('Cookie acceptance is required.'));
  }
  // Continue with existing logic
  next();
});



// convert a connect middleware to a Socket.IO middleware
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
io.engine.use(sessionMiddleware);

io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

io.use(expressSocketIoSession(sessionMiddleware));
io.use(async (socket, next) => {
  const userTimeZone = socket.handshake.query.userTimeZone;
  const userLang = socket.handshake.query.userLang;
  // console.log("io.use userLang=", userLang, userTimeZone, socket.id);

  socket.request.session.userTimeZone = userTimeZone;
  socket.request.session.userLang = userLang;

 
  // check for guestID cookie
  const guestIDCookie = socket.handshake.headers.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('guestID='));

  if (guestIDCookie) {
    const guestID = guestIDCookie.split('=')[1];
    socket.request.session.guestID = guestID;
    console.log("if guestIDCookie =", socket.request.session.guestID)
    
    const guestUser = await Guest.findOne({ guestUserID: guestID });

    if (guestUser) {
      socket.request.session.guestUser = guestUser
      // socket.data = { guestUser: guestUser }
    }
  } else {
    // generate new guestID
    const newGuestUser = await generateGuestID(socket.request.session.timeZone, socket.request.session.userLang);
    socket.request.session.guestUser = newGuestUser
    socket.request.session.guestID = newGuestUser.guestID;

    // socket.data = { guestUser: newGuestUser };
    
    // emit new guestID to client to set a cookie
    socket.emit('setCookie', newGuestUser.guestID);
    console.log("emitted cookie? newGuestUser=", newGuestUser.guestID)
  }

  if (socket.request.user) {
    socket.chatusername = socket.request.user.userName;
    socket.request.session.status = 'loggedIn';

  } else {
    socket.chatusername = socket.request.session.guestUser.userName;
    socket.request.session.status = 'guest';

  }
  // console.log("socket.chatuser=", socket.chatusername)

  const session = socket.request.session;
  session.save();
  console.log("Big check session=", session, "end")
  
  next();
});

// create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Get current user
function getCurrentUser(username) {
  return chatUsers.find(chatUser => chatUser.username === username);
}


// User leaves chat
function userLeave(socketID) {

  for (const chatUser of chatUsers) {
    const socketIndex = chatUser.socketIDs.indexOf(socketID);
    if (socketIndex !== -1) {
      chatUser.socketIDs.splice(socketIndex, 1); // Remove the disconnected socket ID
      chatUser.userCount = chatUser.socketIDs.length; // Update the user count
      if (chatUser.userCount === 0) {
        // Remove the user when the count reaches 0
        const chatUserIndex = chatUsers.indexOf(chatUser);
        chatUsers.splice(chatUserIndex, 1);
      }
      return chatUser
    }
  }
}

// // Get room users
function getRoomUsers(room) {
  return chatUsers.filter(chatUser => chatUser.room === room);
}

// // Join user to chat
// userJoin(chatusername, username, room, _id, socketID);
function userJoin(chatusername, username, room, _id, socketID) {
  console.log("IN USER JOIN", chatusername, username, room, _id, socketID)
  const existingChatUser = chatUsers.find((chatUser) => chatusername === chatUser.username && chatUser.room === room);

  if (existingChatUser) {
    
    existingChatUser.userCount++;
    existingChatUser.socketIDs.push(socketID);
    return existingChatUser;
  }
  const chatUser = { socketIDs: [socketID], username, room, _id, userCount: 1 };
  chatUsers.push(chatUser);
  return chatUser;
}

 
// run when client connects
io.on("connection", async ( socket) => {

  console.log("io connection", socket.id, socket.request.session.status)
    const userTimeZone = socket.request.session.userTimeZone;
    const userLang = socket.request.session.userLang;
    const guestID = socket.request.session.guestID;
    const userStatus = socket.request.session.status;
    socket.emit('setStatus', socket.request.session.status)
  console.log(socket.chatusername, "connected setStatus sent?", socket.request.session.status, socket.id)
   
      try {
        const result = await  Guest.findOneAndUpdate( 
          { guestUserID: guestID },
          { $set: { timezone: userTimeZone }},
          { new: true },
        );
      } catch (err) {
         console.error(err);
      }

    
        // Runs when client disconnects
        socket.on("disconnect", (reason) => {
          console.log("fix disconnect", socket.id)
          const chatUser = userLeave(socket.id);
        
              if(chatUser) {
                console.log(`${chatUser.username} disconnected from ${chatUser.room} because reason: ${reason}`)
                io.to(chatUser.room).emit(
                  "message",
                  formatMessage(botName, `${chatUser.username} has left the chat because: ${reason}`)
                );
                // Send users and room info
                io.to(chatUser.room).emit("roomUsers", {
                  room: chatUser.room,
                  chatUsers: getRoomUsers(chatUser.room),
                });
              } else{
                console.log(`${socket.chatusername} Disconnected because reason: ${reason}`)
              }
        });

      
        socket.on("joinLobby", () =>  {
              console.log(`${socket.chatusername} joined The Lobby`)
          // broadcast updates
              setInterval(() => {

                const postingTime = new Date();
                const localTime = postingTime.toLocaleString( userLang, {timeZone: userTimeZone } )

              socket.emit('timeData', localTime);}, 1000);
              socket.emit("timeClock", `It's about time... ${socket.chatusername}, Connected= ${socket.connected}, socketID: ${socket.id}`)
        });
      
        socket.on("joinRoom", ({ username, room, _id}) => {
          console.log("joining room??", username, room, _id)
          const chatUser = userJoin(socket.chatusername, username, room, _id, socket.id);
          console.log(`${socket.chatusername} joined ${chatUser.room}`, chatUser, socket.request.session.guestID)
          socket.join(chatUser.room);

           // Send users and room info

           io.to(chatUser.room).emit("roomUsers", {
            room: chatUser.room,
            chatUsers: getRoomUsers(chatUser.room),
          });

           // create email notification
           const roomUsers = getRoomUsers(chatUser.room);
           const usernames = roomUsers.map(user => user.username).join(', ');
           const mailOptions = {
            from: process.env.EMAIL_USER,
             to: ['rachel@racheleckenrod.com', 'backintobalance@gmail.com', 'goodgrieflive@gmail.com'],
             subject: `${username} joined ${room}`,
             text: `Current users in ${room}:  ${usernames}`
           };

           // Send the email
              transporter.sendMail(mailOptions, (emailError) => {
                if (emailError) {
                  console.error("Error sending email", emailError);
                  // Handle the error, e.g., log it or emit an error event
                } else {
                  console.log("chatroom Email sent successfully");
                  // Email sent successfully, you can add further logic if needed
                }
              });
            

          // Broadcast when a user connects
          socket.broadcast
          .to(chatUser.room)
          .emit(
            "message",  formatMessage(botName,`${chatUser.username} has joined the chat`)
          );
    
          async function fetchRecentMessages() {
            try {
              const messages = await ChatMessage.find({ room: chatUser.room })
                .sort({ timestamp: -1 })
                .limit(10)
                .exec();

              const formattedMessages = [];

              for (const message of messages) {
                try {
                  const user = await User.findById(message.user);
                  let username;

                  if (user) {
                    username = user.userName;
                  } else {
                    const guestUser = await Guest.findById(message.user);
                    if (guestUser) {
                      username = guestUser.userName;
                    }
                  }
                  const formattedMessage = {
                    text: message.message,
                    username: username,
                    time: message.timestamp,
                  };

                  formattedMessages.push(formattedMessage);
                } catch (error) {
                  console.error("Error fetching user data", error);
                }
              }
              socket.emit("recentMessages", formattedMessages.reverse());
            } catch (error) {
              console.error("Error fetching recentMessages", error);
            }
          };

          fetchRecentMessages();

          // Listen for chatMessage

          socket.on("chatMessage", async (msg) => {
            // console.log("chat messages", userTimeZone, socket.request.session.userTimeZone)
          // console.log("socket.user=",socket.user, socket.id)
          const chatUser = getCurrentUser(socket.chatusername);
            // console.log(chatUser, "from getCurrentUser", socket.id, socket.chatusername)
          try {
            const newMessage = new ChatMessage({
              room: chatUser.room,
              user: chatUser._id,
              message: msg,
              timestamp: new Date(),
            });

            const savedMessage = await  newMessage.save();

            console.log(`${chatUser.username} said "${savedMessage.message}" in the ${chatUser.room} from  ${userTimeZone} socket.id= ${socket.id}`);
            io.to(chatUser.room).emit("message", formatMessage(chatUser.username, savedMessage.message));
          } catch(error) {
              console.error('Error saving chat message:', error);
          }
          });


         // Welcome current user
        socket.emit("message", formatMessage(botName, `Welcome to the room "${chatUser.room}" of Good Grief Live, ${chatUser.username}.`));

    }); 
});

//Setup Routes For Which The Server Is Listening

app.use("/api", mainRoutes);
app.use("/api/post", postRoutes);
app.use("/api/comment", commentRoutes);
app.use("/api/chat/:room", chatRoutes);

app.use("/chat", chatRoutes);


server.listen(PORT, () => { console.log(`Server running on port ${PORT}`)});


