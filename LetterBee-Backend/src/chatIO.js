import { app } from "./app.js";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "./models/user.models.js";
import { Message } from "./models/Message.models.js";
import { GroupMessage } from "./models/groupMessage.models.js";
import { Notification } from "./models/notification.models.js";
import fs from "fs";
import dotenv from "dotenv";
import { FRONTEND_API } from "./Frontend_API.js";
import { transporter } from "./sendOTP.js";

dotenv.config({ path: "./.env" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_API,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let users = {},
  groups = {};

io.on("connection", (socket) => {

  // User Joined on chat and see how many people are seeing my account
  socket.on("new-user-joined", async (userId, userName) => {
    socket.join(userId);
    if (users[userId]) {
      // Existing object ke preserve kore socketId update kora holo
      users[userId].socketId = socket.id;
      users[userId].name = userName;
      // viewers check kore map kora holo
      if (users[userId].viewers) {
        users[userId].viewers.map((viewerId) => {
          if (users[viewerId]?.selectedUser === userId) {
            io.to(users[viewerId].id).emit("state", "online");
          }
        });
      }
    } else {
      users[userId] = { id: userId, name: userName, socketId: socket.id };
    }
    console.log("Usersjoin", users);
  });

  // Check selected users are online or offline and relationship status, store previous sms,
  socket.on("reciever add", async ({ userId, receiverId, receiverName }) => {
    try {
      // send online or offline state
      if (users[userId]) {
        users[userId].selectedUser = receiverId;
      }
      if (users[receiverId]) {
        if (users[receiverId].socketId) {
          if (users[receiverId].viewers) {
            users[receiverId].viewers.push(userId);
          } else {
            users[receiverId].viewers = [userId];
          }
          io.to(userId).emit("state", "online");
        } else {
          if (users[receiverId].viewers) {
            users[receiverId].viewers.push(userId);
          } else {
            users[receiverId].viewers = [userId];
          }
          io.to(userId).emit("state", "offline");
        }
      } else {
        console.log("Off");
        users[receiverId] = {
          id: receiverId,
          name: receiverName,
          viewers: [userId],
          socketId: null,
        };
        console.log("users", users);
        io.to(userId).emit("state", "offline");
      }
      const otherUsers = await User.findById(userId);

<<<<<<< HEAD
      console.log("usersoth", otherUsers);

=======
>>>>>>> 443d633a0449f716b0c49857be001897e1d6840e
      const userList = Array.isArray(otherUsers?.otherUsers)
        ? otherUsers.otherUsers
        : [];

      if (userList.length > 0) {
        let found = false;
        for (const user of userList) {
          if (user.id.toString() === receiverId) {
            found = true;
            if (user.relation === "reject") {
              io.to(userId).emit("friends", {
                requestState: "reject",
                participantType: user.participantType,
              });
            } else if (user.relation === "sent") {
              io.to(userId).emit("friends", {
                requestState: "sent",
                participantType: user.participantType,
              });
            } else if (user.relation === "friend") {
              io.to(userId).emit("requestSender", {
                data: user.participantType === "sender" ? "sender" : "receiver",
              });
              io.to(userId).emit("friends", { requestState: "friend" });
              const chatData = await Message.findOne({
                users: {
                  $all: [
                    { $elemMatch: { id: userId } },
                    { $elemMatch: { id: receiverId } },
                  ],
                },
              });
              if (chatData?.messages) {
                for (const message of chatData.messages) {
                  io.to(userId).emit("storedSms", message);
                }
              }
            }
            break;
          }
        }
        if (!found) {
          io.to(userId).emit("friends", { requestState: "noFriend" });
        }
      } else {
        io.to(userId).emit("friends", { requestState: "noFriend" });
      }
    } catch (error) {
      console.error("Socket Error:", error);
    }
  });

  socket.on("check after reload", ({ userId, receiverId }) => {
    if (users[receiverId] && users[receiverId].socketId) {
      if (users[receiverId].viewers) {
        users[receiverId].viewers.push(userId);
      } else {
        users[receiverId].viewers = [userId];
      }
      io.to(userId).emit("state", "online");
    } else {
      users[receiverId] = { viewers: [userId], socketId: null };
      io.to(userId).emit("state", "offline");
    }
  });

  // Sending message system
  socket.on("send message", async (data) => {
    try {
      const {
        userId,
        userName,
        userAvatar,
        receiverId,
        receiverName,
        receiverAvatar,
        identifier,
        sms,
        fileName,
        fileType,
        fileBuffer,
      } = data;
      let buf;
      if (fileBuffer) {
        buf = Buffer.from(fileBuffer);
        const filePath = path.join(__dirname, "uploads", fileName);
        fs.writeFileSync(filePath, buf);
      }
      if (buf) {
        io.to(userId).emit("last message", {
          userId: receiverId,
          sms,
          fileType,
          fileName,
        });
        io.to(receiverId).emit("last message", {
          userId: userId,
          sms,
          fileType,
          fileName,
        });
      } else {
        io.to(userId).emit("last message", { userId: receiverId, sms });
        io.to(receiverId).emit("last message", { userId: userId, sms });
      }
      if (users[receiverId]) {
        if (users[receiverId].selectedUser === userId) {
          io.to(receiverId).emit("receive message", {
            identifier,
            fileName,
            fileType,
            buf,
            sms,
          });
          let existingChat = await Message.findOne({
            "users.id": { $all: [userId, receiverId] },
          });
          if (existingChat) {
            existingChat.messages.push({
              sender: { id: userId },
              reciever: { id: receiverId },
              relation: "friend",
              identifier: identifier,
              text: sms,
              sender_delete: false,
              reciever_delete: false,
              file: {
                fileName,
                fileType,
                fileData: buf,
              },
              timestamp: Date.now(),
            });
            await existingChat.save();
          } else {
            let newChat = new Message({
              users: [
                { id: userId, name: userName, avatar: userAvatar },
                { id: receiverId, name: receiverName, avatar: receiverAvatar },
              ],
              messages: [
                {
                  sender: { id: userId },
                  reciever: { id: receiverId },
                  relation: "friend",
                  identifier,
                  text: sms,
                  sender_delete: false,
                  reciever_delete: false,
                  file: {
                    fileName,
                    fileType,
                    fileData: buf,
                  },
                  timestamp: Date.now(),
                },
              ],
            });
            await newChat.save();
          }
        }
      } else {
        try {
          const existingNotification = await Notification.findOne({
            "sender.id": userId,
            "receiver.id": receiverId,
          });

          const newMessage = {
            identifier,
            text: sms,
            file: fileName ? { fileName, fileType, buf } : undefined,
            sender_delete: false,
            timestamp: Date.now(),
          };
          if (existingNotification) {
            await Notification.updateOne(
              { "sender.id": userId, "receiver.id": receiverId },
              { $push: { messages: newMessage } },
            );
          } else {
            await Notification.create({
              sender: { id: userId, name: userName },
              receiver: { id: receiverId, name: receiverName },
              identifier,
              messages: [newMessage],
            });
          }
        } catch (error) {
          console.error("Error saving notification:", error);
        }
      }
    } catch (err) {
      console.error("Message Transfer Error:", err);
    }
  });

  // Sending Friend Request
  socket.on("sendRequest", async (data) => {
    const {
      userId,
      userName,
      userAvatar,
      receiverId,
      receiverName,
      receiverAvatar,
    } = data;

    // Sender side
    await User.findByIdAndUpdate(userId, {
      $addToSet: {
        otherUsers: {
          id: receiverId,
          fullName: receiverName,
          avatar: receiverAvatar,
          relation: "sent",
          participantType: "sender",
        },
      },
    });

    // Receiver side
    await User.findByIdAndUpdate(receiverId, {
      $addToSet: {
        otherUsers: {
          id: userId,
          fullName: userName,
          avatar: userAvatar,
          relation: "sent",
          participantType: "receiver",
        },
      },
    });

    io.to(receiverId).emit("friends", {
      requestState: "sent",
      participantType: "receiver",
    });
  });

  // Accept Friend Request
  socket.on("acceptRequest", async (data) => {
    const { userId, receiverId, accept } = data;

    const relation = accept === 1 ? "friend" : "reject";

    // User side
    await User.findOneAndUpdate(
      { _id: userId, "otherUsers.id": receiverId },
      {
        $set: {
          "otherUsers.$.relation": relation,
          "otherUsers.$.participantType": "receiver",
        },
      },
    );
    // Receiver side
    await User.findOneAndUpdate(
      { _id: receiverId, "otherUsers.id": userId },
      {
        $set: {
          "otherUsers.$.relation": relation,
          "otherUsers.$.participantType": "sender",
        },
      },
    );

    io.to(receiverId).emit("requestReply", { accept });
    io.to(userId).emit("friends", {
      requestState: relation,
    });
  });

  // Storing sms for offline user
  socket.on("offline_User sms", async (data) => {
    const {
      OwnId,
      OwnName,
      ToId,
      ToName,
      identifier,
      sms,
      fileName,
      fileType,
      fileData,
    } = data;

    io.to(OwnId).emit("last message", { userId: ToId, sms });
    try {
      const existingNotification = await Notification.findOne({
        "sender.id": OwnId,
        "receiver.id": ToId,
      });

      const newMessage = {
        identifier,
        text: sms,
        file: fileName ? { fileName, fileType, fileData } : undefined,
        sender_delete: false,
        timestamp: Date.now(),
      };

      if (existingNotification) {
        await Notification.updateOne(
          { "sender.id": OwnId, "receiver.id": ToId },
          { $push: { messages: newMessage } },
        );
      } else {
        await Notification.create({
          sender: { id: OwnId, name: OwnName },
          receiver: { id: ToId, name: ToName },
          identifier,
          messages: [newMessage],
        });
      }
    } catch (error) {
      console.error("Error saving notification:", error);
    }
  });

  // Video call backend system
  socket.on("video-call", (ToId) => {
    socket.to(ToId).emit("joined");
  });

  socket.on("ice-candidate", (candidate, ToId) => {
    socket.to(ToId).emit("ice-candidate", candidate);
  });

  socket.on("offer", (offer, ToId) => {
    socket.to(ToId).emit("offer", offer);
  });

  socket.on("answer", (answer, ToId) => {
    socket.to(ToId).emit("answer", answer);
  });

  // Delete sms for everyone
  socket.on("delete-everyone", async (data) => {
    const { OwnId, ToId, identifier } = data;
    try {
      // Step 1: Find the document
      const chat = await Message.findOne({
        "users.id": { $all: [OwnId, ToId] },
      });

      if (!chat) {
        console.log("No chat found!");
        return;
      }

      // Step 2: Find the index of the message with the given identifier
      const messageIndex = chat.messages.findIndex(
        (msg) => msg.identifier === identifier,
      );

      if (messageIndex === -1) {
        console.log("Message not found!");
        return;
      }

      // Step 3: Remove the message from the array
      chat.messages.splice(messageIndex, 1);

      // Step 4: Save the updated document
      await chat.save();
    } catch (error) {
      console.log(error);
    }
    io.to(ToId).emit("delete", identifier); // Successfully deleted
  });

  // Delete only one user's sms
  socket.on("delete-me", async (data) => {
    const { OwnId, ToId, identifier, sender } = data;
    try {
      // Step 1: Find the document
      const chat = await Message.findOne({
        "users.id": { $all: [OwnId, ToId] },
      });
      if (!chat) {
        return;
      }
      // Step 2: Find the index of the message with the given identifier
      const message = chat.messages.find(
        (msg) => msg.identifier === identifier,
      );
      if (!message) {
        return;
      }
      if (sender === "You") {
        message.sender_delete = true;
      } else {
        message.reciever_delete = true;
      }
      if (message.sender_delete && message.reciever_delete) {
        chat.messages = chat.messages.filter(
          (msg) => msg.identifier !== identifier,
        );
      }
      // Step 4: Save the updated document
      await chat.save();
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("groupClick", async (data) => {
    const { groupMembers, groupId } = data;
    socket.join(groupId);
    const onlineMember = groupMembers.map((member) => {
      if (users[member.id]) {
        return member;
      }
    });

    const groupMessages =
      await GroupMessage.findById(groupId).select("messages");
    io.to(groupId).emit("onlineMember", onlineMember);
    for (const member of onlineMember) {
      io.to(member.id).emit("updateState", { userId: member.id });
    }
    groupMessages.map((message) => {
      io.to(groupId).emit("groupStoredMessages", {
        senderId: message.sender.id,
        name: message.sender.name,
        avatar: message.sender.avatar,
        identifier: message.sender.identifier,
        text: message.text,
        file: message.file,
      });
    });
  });

  socket.on("send groupMessage", async () => {
    const {
      groupId,
      userId,
      userName,
      userAvatar,
      receiverId,
      receiverName,
      receiverAvatar,
      identifier,
      sms,
      fileName,
      fileType,
      fileData,
    } = data;
    if (fileData) {
      const filePath = path.join(__dirname, "uploads", fileName);
      fs.writeFileSync(filePath, Buffer.from(fileData));
    }
    io.to(receiverId).emit("receive groupMessage", {
      senderId: userId,
      identifier,
      fileName,
      fileType,
      fileData,
      sms,
    });
    let existingChat = await GroupMessage.findById(groupId);
    if (existingChat) {
      existingChat.messages.push({
        sender: { id: userId },
        identifier: identifier,
        text: sms,
        sender_delete: false,
        reciever_delete: [],
        file: {
          fileName,
          fileType,
          fileData,
        },
        timestamp: Date.now(),
      });
      await existingChat.save();
    }
  });

  // Disconnection system
  socket.on("disconnect", () => {
    const entry = Object.entries(users).find(
      ([_, user]) => user.socketId === socket.id,
    );

    if (!entry) return;

    const [userId, user] = entry;

    if (user.viewers?.length) {
      user.viewers.forEach((viewerId) => {
        const viewer = users[viewerId];
        if (!viewer) return;

        if (viewer.selectedUser === userId) {
          io.to(viewer.socketId).emit("checkDisconnect", "offline");
        }

        viewer.viewers = viewer.viewers?.filter((id) => id !== userId);
      });
    }

    delete users[userId];
    console.log("usersDE", users);
  });
});

export { server };


// import { app } from "./app.js";
// import http from "http";
// import { Server } from "socket.io";
// import path from "path";
// import { fileURLToPath } from "url";
// import { User } from "./models/user.models.js";
// import { Message } from "./models/Message.models.js";
// import { GroupMessage } from "./models/groupMessage.models.js";
// import { Notification } from "./models/notification.models.js";
// import fs from "fs";
// import dotenv from "dotenv";
// import { FRONTEND_API } from "./Frontend_API.js";
// import { transporter } from "./sendOTP.js";

// dotenv.config({ path: "./.env" });

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: FRONTEND_API,
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });

// let users = {},
//   groups = {};

// io.on("connection", (socket) => {

//   // Sending OTP system
//   socket.on("sendOtp", async ({ email }) => {

//     const generateOTP = () =>
//       Math.floor(100000 + Math.random() * 900000).toString();
//     const otp = generateOTP();
//     const mailOptions = {
//       from: `"LetterBee" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: "Your OTP Code",
//       text: `Your OTP is ${otp}.`,
//     };

//     try {
//       await transporter.sendMail(mailOptions);
//       users[socket.id] = { email: email, otp: otp };
//       socket.emit("otpVerified",);
//     } catch (error) {
//       socket.emit("otpError", { error: "An error occurred while sending OTP to the email" });
//     }
//   })

//   socket.on("verifyOtp", ({ otp }) => {
//     if (users[socket.id]) {
//       if (users[socket.id].otp === otp) {
//         socket.emit("verified", { verified: true })
//       }
//       else {
//         console.log("Error work");
//         socket.emit("otpError", { error: "Given otp is not correct" });
//       }
//     }
//   })

//   // Chatting System
//   socket.on("new-user-joined", async (userId, userName) => {
//     socket.join(userId);
//     if (users[userId]) {
//       // Existing object ke preserve kore socketId update kora holo
//       users[userId].socketId = socket.id;
//       users[userId].name = userName;
//       // viewers check kore map kora holo
//       if (users[userId].viewers) {
//         users[userId].viewers.map((viewerId) => {
//           if (users[viewerId]?.selectedUser === userId) {
//             io.to(users[viewerId].id).emit("state", "online");
//           }
//         });
//       }
//     } else {
//       users[userId] = { id: userId, name: userName, socketId: socket.id };
//     }
//     console.log("Usersjoin", users);
//   });

//   socket.on("reciever add", async ({ userId, receiverId, receiverName }) => {
//     try {
//       // send online or offline state
//       if (users[userId]) {
//         users[userId].selectedUser = receiverId;
//       }
//       if (users[receiverId]) {
//         if (users[receiverId].socketId) {
//           if (users[receiverId].viewers) {
//             users[receiverId].viewers.push(userId);
//           } else {
//             users[receiverId].viewers = [userId];
//           }
//           io.to(userId).emit("state", "online");
//         } else {
//           if (users[receiverId].viewers) {
//             users[receiverId].viewers.push(userId);
//           } else {
//             users[receiverId].viewers = [userId];
//           }
//           io.to(userId).emit("state", "offline");
//         }
//       } else {
//         console.log("Off");
//         users[receiverId] = {
//           id: receiverId,
//           name: receiverName,
//           viewers: [userId],
//           socketId: null,
//         };
//         console.log("users", users);
//         io.to(userId).emit("state", "offline");
//       }
//       const otherUsers = await User.findById(userId);

//       const userList = Array.isArray(otherUsers?.otherUsers)
//         ? otherUsers.otherUsers
//         : [];

//       if (userList.length > 0) {
//         let found = false;
//         for (const user of userList) {
//           if (user.id.toString() === receiverId) {
//             found = true;
//             if (user.relation === "reject") {
//               io.to(userId).emit("friends", {
//                 requestState: "reject",
//                 participantType: user.participantType,
//               });
//             } else if (user.relation === "sent") {
//               io.to(userId).emit("friends", {
//                 requestState: "sent",
//                 participantType: user.participantType,
//               });
//             } else if (user.relation === "friend") {
//               io.to(userId).emit("requestSender", {
//                 data: user.participantType === "sender" ? "receiver" : "sender",
//               });
//               io.to(userId).emit("friends", { requestState: "friend" });
//               const chatData = await Message.findOne({
//                 users: {
//                   $all: [
//                     { $elemMatch: { id: userId } },
//                     { $elemMatch: { id: receiverId } },
//                   ],
//                 },
//               });
//               if (chatData?.messages) {
//                 for (const message of chatData.messages) {
//                   io.to(userId).emit("storedSms", message);
//                 }
//               }
//             }
//             break;
//           }
//         }
//         if (!found) {
//           io.to(userId).emit("friends", { requestState: "noFriend" });
//         }
//       } else {
//         io.to(userId).emit("friends", { requestState: "noFriend" });
//       }
//     } catch (error) {
//       console.error("Socket Error:", error);
//     }
//   });

//   socket.on("check after reload", ({ userId, receiverId }) => {
//     if (users[receiverId] && users[receiverId].socketId) {
//       if (users[receiverId].viewers) {
//         users[receiverId].viewers.push(userId);
//       } else {
//         users[receiverId].viewers = [userId];
//       }
//       io.to(userId).emit("state", "online");
//     } else {
//       users[receiverId] = { viewers: [userId], socketId: null };
//       io.to(userId).emit("state", "offline");
//     }
//     console.log("CAR");
//   });

//   socket.on("send message", async (data) => {
//     try {
//       const {
//         userId,
//         userName,
//         userAvatar,
//         receiverId,
//         receiverName,
//         receiverAvatar,
//         identifier,
//         sms,
//         fileName,
//         fileType,
//         fileBuffer,
//       } = data;
//       let buf;
//       if (fileBuffer) {
//         buf = Buffer.from(fileBuffer);
//         const filePath = path.join(__dirname, "uploads", fileName);
//         fs.writeFileSync(filePath, buf);
//       }
//       if (buf) {
//         io.to(userId).emit("last message", {
//           userId: receiverId,
//           sms,
//           fileType,
//           fileName,
//         });
//         io.to(receiverId).emit("last message", {
//           userId: userId,
//           sms,
//           fileType,
//           fileName,
//         });
//       } else {
//         io.to(userId).emit("last message", { userId: receiverId, sms });
//         io.to(receiverId).emit("last message", { userId: userId, sms });
//       }
//       if (users[receiverId]) {
//         if (users[receiverId].selectedUser === userId) {
//           io.to(receiverId).emit("receive message", {
//             identifier,
//             fileName,
//             fileType,
//             buf,
//             sms,
//           });
//           let existingChat = await Message.findOne({
//             "users.id": { $all: [userId, receiverId] },
//           });
//           if (existingChat) {
//             existingChat.messages.push({
//               sender: { id: userId },
//               reciever: { id: receiverId },
//               relation: "friend",
//               identifier: identifier,
//               text: sms,
//               sender_delete: false,
//               reciever_delete: false,
//               file: {
//                 fileName,
//                 fileType,
//                 fileData: buf,
//               },
//               timestamp: Date.now(),
//             });
//             await existingChat.save();
//           } else {
//             let newChat = new Message({
//               users: [
//                 { id: userId, name: userName, avatar: userAvatar },
//                 { id: receiverId, name: receiverName, avatar: receiverAvatar },
//               ],
//               messages: [
//                 {
//                   sender: { id: userId },
//                   reciever: { id: receiverId },
//                   relation: "friend",
//                   identifier,
//                   text: sms,
//                   sender_delete: false,
//                   reciever_delete: false,
//                   file: {
//                     fileName,
//                     fileType,
//                     fileData: buf,
//                   },
//                   timestamp: Date.now(),
//                 },
//               ],
//             });
//             await newChat.save();
//           }
//         }
//       } else {
//         try {
//           const existingNotification = await Notification.findOne({
//             "sender.id": userId,
//             "receiver.id": receiverId,
//           });

//           const newMessage = {
//             identifier,
//             text: sms,
//             file: fileName ? { fileName, fileType, buf } : undefined,
//             sender_delete: false,
//             timestamp: Date.now(),
//           };
//           if (existingNotification) {
//             await Notification.updateOne(
//               { "sender.id": userId, "receiver.id": receiverId },
//               { $push: { messages: newMessage } },
//             );
//           } else {
//             await Notification.create({
//               sender: { id: userId, name: userName },
//               receiver: { id: receiverId, name: receiverName },
//               identifier,
//               messages: [newMessage],
//             });
//           }
//         } catch (error) {
//           console.error("Error saving notification:", error);
//         }
//       }
//     } catch (err) {
//       console.error("Message Transfer Error:", err);
//     }
//   });

//   socket.on("sendRequest", async (data) => {
//     const {
//       userId,
//       userName,
//       userAvatar,
//       receiverId,
//       receiverName,
//       receiverAvatar,
//     } = data;

//     // Sender side
//     await User.findByIdAndUpdate(userId, {
//       $addToSet: {
//         otherUsers: {
//           id: receiverId,
//           fullName: receiverName,
//           avatar: receiverAvatar,
//           relation: "sent",
//           participantType: "sender",
//         },
//       },
//     });

//     // Receiver side
//     await User.findByIdAndUpdate(receiverId, {
//       $addToSet: {
//         otherUsers: {
//           id: userId,
//           fullName: userName,
//           avatar: userAvatar,
//           relation: "sent",
//           participantType: "receiver",
//         },
//       },
//     });

//     io.to(receiverId).emit("friends", {
//       requestState: "sent",
//       participantType: "receiver",
//     });
//   });

//   socket.on("acceptRequest", async (data) => {
//     const { userId, receiverId, accept } = data;

//     const relation = accept === 1 ? "friend" : "reject";

//     // User side
//     await User.findOneAndUpdate(
//       { _id: userId, "otherUsers.id": receiverId },
//       {
//         $set: {
//           "otherUsers.$.relation": relation,
//           "otherUsers.$.participantType": "sender",
//         },
//       },
//     );

//     // Receiver side
//     await User.findOneAndUpdate(
//       { _id: receiverId, "otherUsers.id": userId },
//       {
//         $set: {
//           "otherUsers.$.relation": relation,
//           "otherUsers.$.participantType": "receiver",
//         },
//       },
//     );

//     io.to(receiverId).emit("requestReply", { accept });
//     io.to(userId).emit("friends", {
//       requestState: relation,
//     });
//   });

//   socket.on("offline_User sms", async (data) => {
//     const {
//       OwnId,
//       OwnName,
//       ToId,
//       ToName,
//       identifier,
//       sms,
//       fileName,
//       fileType,
//       fileData,
//     } = data;

//     io.to(OwnId).emit("last message", { userId: ToId, sms });
//     try {
//       const existingNotification = await Notification.findOne({
//         "sender.id": OwnId,
//         "receiver.id": ToId,
//       });

//       const newMessage = {
//         identifier,
//         text: sms,
//         file: fileName ? { fileName, fileType, fileData } : undefined,
//         sender_delete: false,
//         timestamp: Date.now(),
//       };

//       if (existingNotification) {
//         await Notification.updateOne(
//           { "sender.id": OwnId, "receiver.id": ToId },
//           { $push: { messages: newMessage } },
//         );
//       } else {
//         await Notification.create({
//           sender: { id: OwnId, name: OwnName },
//           receiver: { id: ToId, name: ToName },
//           identifier,
//           messages: [newMessage],
//         });
//       }
//     } catch (error) {
//       console.error("Error saving notification:", error);
//     }
//   });

//   socket.on("video-call", (ToId) => {
//     socket.to(ToId).emit("joined");
//   });

//   socket.on("ice-candidate", (candidate, ToId) => {
//     socket.to(ToId).emit("ice-candidate", candidate);
//   });

//   socket.on("offer", (offer, ToId) => {
//     socket.to(ToId).emit("offer", offer);
//   });

//   socket.on("answer", (answer, ToId) => {
//     socket.to(ToId).emit("answer", answer);
//   });

//   socket.on("delete-everyone", async (data) => {
//     const { OwnId, ToId, identifier } = data;
//     try {
//       // Step 1: Find the document
//       const chat = await Message.findOne({
//         "users.id": { $all: [OwnId, ToId] },
//       });

//       if (!chat) {
//         console.log("No chat found!");
//         return;
//       }

//       // Step 2: Find the index of the message with the given identifier
//       const messageIndex = chat.messages.findIndex(
//         (msg) => msg.identifier === identifier,
//       );

//       if (messageIndex === -1) {
//         console.log("Message not found!");
//         return;
//       }

//       // Step 3: Remove the message from the array
//       chat.messages.splice(messageIndex, 1);

//       // Step 4: Save the updated document
//       await chat.save();
//     } catch (error) {
//       console.log(error);
//     }
//     io.to(ToId).emit("delete", identifier); // Successfully deleted
//   });

//   socket.on("delete-me", async (data) => {
//     const { OwnId, ToId, identifier, sender } = data;
//     try {
//       // Step 1: Find the document
//       const chat = await Message.findOne({
//         "users.id": { $all: [OwnId, ToId] },
//       });
//       if (!chat) {
//         return;
//       }
//       // Step 2: Find the index of the message with the given identifier
//       const message = chat.messages.find(
//         (msg) => msg.identifier === identifier,
//       );
//       if (!message) {
//         return;
//       }
//       if (sender === "You") {
//         message.sender_delete = true;
//       } else {
//         message.reciever_delete = true;
//       }
//       if (message.sender_delete && message.reciever_delete) {
//         chat.messages = chat.messages.filter(
//           (msg) => msg.identifier !== identifier,
//         );
//       }
//       // Step 4: Save the updated document
//       await chat.save();
//     } catch (error) {
//       console.log(error);
//     }
//   });

//   socket.on("groupClick", async (data) => {
//     const { groupMembers, groupId } = data;
//     socket.join(groupId);
//     const onlineMember = groupMembers.map((member) => {
//       if (users[member.id]) {
//         return member;
//       }
//     });

//     const groupMessages =
//       await GroupMessage.findById(groupId).select("messages");
//     io.to(groupId).emit("onlineMember", onlineMember);
//     for (const member of onlineMember) {
//       io.to(member.id).emit("updateState", { userId: member.id });
//     }
//     groupMessages.map((message) => {
//       io.to(groupId).emit("groupStoredMessages", {
//         senderId: message.sender.id,
//         name: message.sender.name,
//         avatar: message.sender.avatar,
//         identifier: message.sender.identifier,
//         text: message.text,
//         file: message.file,
//       });
//     });
//   });

//   socket.on("send groupMessage", async () => {
//     const {
//       groupId,
//       userId,
//       userName,
//       userAvatar,
//       receiverId,
//       receiverName,
//       receiverAvatar,
//       identifier,
//       sms,
//       fileName,
//       fileType,
//       fileData,
//     } = data;
//     if (fileData) {
//       const filePath = path.join(__dirname, "uploads", fileName);
//       fs.writeFileSync(filePath, Buffer.from(fileData));
//     }
//     io.to(receiverId).emit("receive groupMessage", {
//       senderId: userId,
//       identifier,
//       fileName,
//       fileType,
//       fileData,
//       sms,
//     });
//     let existingChat = await GroupMessage.findById(groupId);
//     if (existingChat) {
//       existingChat.messages.push({
//         sender: { id: userId },
//         identifier: identifier,
//         text: sms,
//         sender_delete: false,
//         reciever_delete: [],
//         file: {
//           fileName,
//           fileType,
//           fileData,
//         },
//         timestamp: Date.now(),
//       });
//       await existingChat.save();
//     }
//   });

//   socket.on("disconnect", () => {
//     const entry = Object.entries(users).find(
//       ([_, user]) => user.socketId === socket.id,
//     );

//     if (!entry) return;

//     const [userId, user] = entry;

//     if (user.viewers?.length) {
//       user.viewers.forEach((viewerId) => {
//         const viewer = users[viewerId];
//         if (!viewer) return;

//         if (viewer.selectedUser === userId) {
//           io.to(viewer.socketId).emit("checkDisconnect", "offline");
//         }

//         viewer.viewers = viewer.viewers?.filter((id) => id !== userId);
//       });
//     }

//     delete users[userId];
//     console.log("usersDE", users);
//   });
// });

// export { server };
