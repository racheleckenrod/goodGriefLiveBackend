import { socket, userTimeZone, userLang, userStatus } from './js/shared.js'

let el

// console.log("test timezone", userTimeZone)

const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('chatUsers');
const username = document.getElementById('username').innerHTML;
const room =  roomName.innerHTML

const _id =  document.getElementById('_id').innerHTML;

// const socket = io({
//   reconnection: true,
//   reconnectionAttempts: 10,
//   reconnectionDelay: 1000,
// });

let timeClock =  document.getElementById('time');

socket.on('connect', () => {

  console.log('lobby connected')

  socket.emit("joinLobby")


  // // Join chatroom
  socket.emit('joinRoom', {  username, room, _id });


});
// socket.on('reconnect', (attemptNumber) => {
//   console.log(`Reconnected after ${attemptNumber} attempts`);
// });


socket.on('timeClock', data => {
  timeClock.innerHTML = data
})

socket.on('timeData', (timeString2) => {
  el = document.getElementById('currently');
  el.innerHTML = 'Currently: ' + timeString2;

})


// // Get room and users
socket.on('roomUsers', ({ room, chatUsers }) => {
  outputRoomName(room);
  outputUsers(chatUsers);
});

// Recent messages
socket.on("recentMessages", (messages) => {
  // display the recent messages in the chatroom
  messages.forEach((message) => {
    outputMessage(message);
  });
});

// // Message from server
socket.on('message', (message) => {
  outputMessage(message);

//   // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('tx', (message) => {
  console.log("login received", message)
  outputMessage(message);

  //   // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('loggedOut', (message) => {
  console.log("logout received", message)
  outputMessage(message);

  //   // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
})

// // Message submit- prevent default stops page reload
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

//   // Get message text
  let msg = e.target.elements.msg.value;
  console.log("msg", msg)
//   msg = msg.trim();

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
  roomName.innerText = room;
}
// create display names with window count
function getDisplayName(username, userCount) {
  return userCount > 1 ? `${username} (${userCount})` : username;
}
// // Add users to DOM
function outputUsers(chatUsers) {
  userList.innerHTML = `
  ${chatUsers.map(chatUser => `<li class="${chatUser.username} openModalButton" data-modal="noAccess" >${getDisplayName(chatUser.username, chatUser.userCount)}</li>`).join('')}
  `;
  // Add event listeners to names to connect to their profile page
  chatUsers.forEach((chatUser) => {
    console.log("first", chatUser)
    console.log("userStatus=", userStatus)
    const modalText = document.getElementById('modalLoginText');
    const logInModal = document.querySelector('.logInModal');
    const noProfileModal = document.getElementById('noProfileModal')

    
       document.querySelector(`.${chatUser.username}`).addEventListener('click', () => {
        console.log("click")
      if (userStatus === 'guest') {
        modalText.textContent = 'Guest users do not have access to user Profiles'
        logInModal.style.display = 'block';

        // alert("Guest users don't have access to user Profiles. Please sign up to see them.");
      } else if (chatUser.username.startsWith("guest")){
        // openModal(noProfileModal)
        noProfileModal.style.display = 'block';
        // alert("Guest users do not have profiles.");
      } else {
        window.open(`/profile/${chatUser._id}`, '_blank');
      }
      // console.log("forEach", user.username, user._id)
      //  window.location = `/profile/${user._id}`
    });
    
   
//     const li = document.createElement('li');
//     li.innerText = user.username;
//     userList.appendChild(li);
  });
};

// LoggedIn Required Modal

console.log("Check")
document.addEventListener('DOMContentLoaded', function () {
  const modalButtons = document.querySelectorAll('.openModalButton');
  const logInModal = document.querySelector('.logInModal');
  const modalText = document.getElementById('modalLoginText');
  const noProfileModal = document.getElementById('noProfileModal')

  modalButtons.forEach(function (button) {
      button.addEventListener('click', function (event) {
          event.preventDefault();
          console.log("button clicked")

          if (userStatus !== 'loggedIn') {
            console.log("user status===", userStatus)
          let action = button.getAttribute('data-modal');

          const notLoggedInMessage = 'You need to be logged in to ';

          if (action === 'chatRoom') {
            modalText.textContent = notLoggedInMessage + 'enter that Chat Room.'
          } else if (action === 'profile') {
            modalText.textContent = notLoggedInMessage + 'to have a Profile.'
          } else if (action === 'comment') {
            modalText.textContent = notLoggedInMessage + 'comment on Posts.'
          } else if (action === 'noAccess') {
            modalText.textContent = 'Guest users do not have access to user Profiles'
          } else if (action === 'feed') {
            modalText.textContent = notLoggedInMessage + 'to see our Community posts.'
          } else if (action === 'newPost') {
            modalText.textContent = notLoggedInMessage + 'make a new Post.'
          }
          openModal(logInModal);
        } else {
          window.location.href = button.href;
        }
      });
  });

  // let scrollPosition = 0;
  function openModal(modal) {
    // scrollPosition = window.scrollY || window.pageYOffset;
    modal.style.display = 'block'
  };

  // Close modal when the close button is clicked
  let closeButton = logInModal.querySelector('.close');
  closeButton.addEventListener('click', function () {
      logInModal.style.display = 'none';
      // window.scrollTo(0, scrollPosition);
  });


  let continueButton = logInModal.querySelector('.continue');
  continueButton.addEventListener('click', function () {
      logInModal.style.display = 'none';
      // window.scrollTo(0, scrollPosition);
  });
  // // Close modal when an element with the 'continue' class is clicked
  // logInModal.addEventListener('click', function (event) {
  //   if (event.target.classList.contains('continue')) {
  //     logInModal.style.display = 'none';
  //     console.log("continue b4", scrollPosition);
  //     let continueButton = document.getElementById('continueButton');
  //     if (continueButton) {
  //       .scrollTo(0, scrollPosition);
  //     console.log("continue after")
  //     };
  //   }
  // });

   // Close modal when clicking outside the modal
  window.addEventListener('click', function (event) {
  if (event.target === logInModal) {
    logInModal.style.display = 'none';
    // window.scrollTo(0, scrollPosition);

  }

  // Close noProfileModal when the close button is clicked
  let closeNoProfileButton = noProfileModal.querySelector('.close');
  closeNoProfileButton.addEventListener('click', function () {
      noProfileModal.style.display = 'none';
  });

  // Close modal when an element with the 'continue' class is clicked
  noProfileModal.addEventListener('click', function (event) {
    if (event.target.classList.contains('continue')) {
      noProfileModal.style.display = 'none';
    }
  });

   // Close modal when clicking outside the modal
  window.addEventListener('click', function (event) {
  if (event.target === noProfileModal) {
    noProfileModal.style.display = 'none';
  }
});
});
});
