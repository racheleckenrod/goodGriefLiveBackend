import { socket, userTimeZone, userLang } from './shared.js'

const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('chatUsers');
const username = document.getElementById('username').innerHTML;
const room =  roomName.innerHTML

const _id =  document.getElementById('_id').innerHTML;


socket.on('connect', () => {
    // // Join chatroom
  socket.emit('joinRoom', { username, room, _id});
  console.log(username, "connected to", room )
  // console.log(userList)
})


// // Get room and users
socket.on('roomUsers', ({ room, chatUsers }) => {
  // console.log("mainJS2", socket, socket.connected, socket.id)

  console.log("from roomUsers", chatUsers)
  outputRoomName(room);
  // console.log("output", room)
  outputUsers(chatUsers);
});



// Recent messages
socket.on("recentMessages", (messages) => {
  // display the recent messages in the chatroom
  messages.forEach((message) => {
    // const messageText = message.message;
    // const username = message.user.userName;
    // const timestamp = message.timestamp
    outputMessage(message);
  });
});

// // Message from server
socket.on('message', (message) => {
  // console.log(message);
  outputMessage(message);

//   // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// // Message submit- prevent default stops page reload
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

//   // Get message text
  let msg = e.target.elements.msg.value;
  // console.log(msg)
//   msg = msg.trim();

//   if (!msg) {
//     return false;
//   }

//   // Emit message to server
  socket.emit('chatMessage', msg);

//   // Clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});


// // Output message to DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');

  console.log(message)

  const timestamp = new Date(message.time)
  
  const localTime = timestamp.toLocaleString( userLang, {timeZone: userTimeZone } )

  div.innerHTML = `<p class="meta">${message.username} <span>${localTime}</span></p>
  <p class="text">
    ${message.text}
  </p>`;

  document.querySelector('.chat-messages').appendChild(div);
}


// // Add room name to DOM
function outputRoomName(room) {
  // console.log("output test", socket, socket.connected, socket.id)
  roomName.innerText = room;
}

// // Add users to DOM
function outputUsers(chatUsers) {
  console.log("outputUsers", chatUsers)
  userList.innerHTML = `
  ${chatUsers.map(chatUser => `<li class="${chatUser.username}" >${chatUser.username}</li>`).join('')}
  `;

  // Add event listeners to names to connect to their profile page
  chatUsers.forEach((chatUser) => {
    // console.log("first", user)
    document.querySelector(`.${chatUser.username}`).addEventListener('click', () => {
      console.log("forEach", chatUser.username, chatUser._id)
       window.location = `/profile/${chatUser._id}`
    })
//     const li = document.createElement('li');
//     li.innerText = user.username;
//     userList.appendChild(li);
  });
}

// //Prompt the user before leave chat room
document.getElementById('leave-btn').addEventListener('click', () => {
  // const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
  // if (leaveRoom) {
    window.location = '../';
  // } else {
  // }
});
