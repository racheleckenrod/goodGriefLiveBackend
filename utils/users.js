// const users = [];


// // // Join user to chat
// function userJoin(id, username, room, _id) {
//     console.log("userjoin", id, username, room, _id)

//   const user = { id, username, room, _id };


//   users.push(user);

//   // console.log("ho hum", users)
  
//   return user;
 
// }

// // // Get current user
// function getCurrentUser(id) {
//   console.log("getCurrentUser:", id, users)
//   return users.find(user => user.id === id);
// }

// // // User leaves chat
// function userLeave(id) {
//   const index = users.findIndex(user => user.id === id);

//   if (index !== -1) {
//     return users.splice(index, 1)[0];
//   }
// }

// // // Get room users
// function getRoomUsers(room) {
//   return users.filter(user => user.room === room);
// }

// // get all users for lobby info
// function getAllUsers(room)  {
//   return users
// }

// module.exports = {
//   userJoin,
//   getCurrentUser,
//   userLeave,
//   getRoomUsers,
//   getAllUsers
// };
