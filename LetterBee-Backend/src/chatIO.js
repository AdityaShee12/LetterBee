import { app } from "./app.js";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "./models/user/user.model.js";
import { Message } from "./models/chat/message.model.js";
import { GroupMessage } from "./models/chat/groupMessage.model.js";
import { Notification } from "./models/user/notification.model.js";
import fs from "fs";
import dotenv from "dotenv";
import { FRONTEND_API } from "./Frontend_API.js";
import { transporter } from "./config/mail.config.js";

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
  socket.on("new-user-joined", async ({senderId, userName}) => {
    socket.join(senderId);
    if (users[senderId]) {
      users[senderId].socketId = socket.id;
      users[senderId].name = userName;
      if (users[senderId].viewers) {
        users[senderId].viewers.map((viewerId) => {
          if (users[viewerId]?.selectedUser === senderId) {
            io.to(users[viewerId].id).emit("state", "online");
          }
        });
      }
    } else {
      users[senderId] = { id: senderId, name: userName, socketId: socket.id };
    }
  });

  // Check selected users are online or offline and relationship status, store previous sms,
  socket.on("reciever add", async ({ senderId, receiverId, receiverFullName }) => {
    try {
      if (senderId) {
        if (users[senderId]) {
          users[senderId].selectedUser = receiverId;
        }
        if (users[receiverId]) {
          if (users[receiverId].socketId) {
            if (users[receiverId].viewers) {
              users[receiverId].viewers.push(senderId);
            } else {
              users[receiverId].viewers = [senderId];
            }
            io.to(senderId).emit("state", "online");
          } else {
            if (users[receiverId].viewers) {
              users[receiverId].viewers.push(senderId);
            } else {
              users[receiverId].viewers = [senderId];
            }
            io.to(senderId).emit("state", "offline");
          }
        } else {
          users[receiverId] = {
            id: receiverId,
            name: receiverFullName,
            viewers: [senderId],
            socketId: null,
          };
          io.to(senderId).emit("state", "offline");
        }
        const otherUsers = await User.findById(senderId);

        const userList = Array.isArray(otherUsers?.otherUsers)
          ? otherUsers.otherUsers
          : [];

        if (userList?.length > 0) {
          let found = false;
          for (const user of userList) {
            if (user.id.toString() === receiverId) {
              found = true;
              if (user.relation === "reject") {
                io.to(senderId).emit("friends", {
                  requestState: "reject",
                  participantType: user.participantType,
                });
              } else if (user.relation === "sent") {
                io.to(senderId).emit("friends", {
                  requestState: "sent",
                  participantType: user.participantType,
                });
              } else if (user.relation === "friend") {
                io.to(senderId).emit("requestSender", {
                  data: user.participantType === "sender" ? "sender" : "receiver",
                });
                io.to(senderId).emit("friends", { requestState: "friend" });
                const chatData = await Message.findOne({
                  users: {
                    $all: [
                      { $elemMatch: { id: senderId } },
                      { $elemMatch: { id: receiverId } },
                    ],
                  },
                });
                if (chatData?.messages) {
                  for (const message of chatData.messages) {
                    io.to(senderId).emit("storedSms", message);
                  }
                }
              }
              break;
            }
          }
          if (!found) {
            io.to(senderId).emit("friends", { requestState: "noFriend" });
          }
        } else {
          io.to(senderId).emit("friends", { requestState: "noFriend" });
        }
      }
    } catch (error) {
      console.error("Socket Error:", error);
    }
  });

  socket.on("check after reload", ({ senderId, receiverId }) => {
    if (users[receiverId] && users[receiverId].socketId) {
      if (users[receiverId].viewers) {
        users[receiverId].viewers.push(senderId);
      } else {
        users[receiverId].viewers = [senderId];
      }
      io.to(senderId).emit("state", "online");
    } else {
      users[receiverId] = { viewers: [senderId], socketId: null };
      io.to(senderId).emit("state", "offline");
    }
  });

  // Sending message system
  socket.on("send message", async (data) => {
    try {
      const {
        senderId,
        userName,
        senderAvatar,
        receiverId,
        receiverFullName,
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
        io.to(senderId).emit("last message", {
          senderId: receiverId,
          sms,
          fileType,
          fileName,
        });
        io.to(receiverId).emit("last message", {
          senderId: senderId,
          sms,
          fileType,
          fileName,
        });
      } else {
        io.to(senderId).emit("last message", { senderId: receiverId, sms });
        io.to(receiverId).emit("last message", { senderId: senderId, sms });
      }
      if (users[receiverId]) {
        if (users[receiverId].selectedUser === senderId) {
          io.to(receiverId).emit("receive message", {
            identifier,
            fileName,
            fileType,
            buf,
            sms,
          });
          let existingChat = await Message.findOne({
            "users.id": { $all: [senderId, receiverId] },
          });
          if (existingChat) {
            existingChat.messages.push({
              sender: { id: senderId },
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
                { id: senderId, name: userName, avatar: senderAvatar },
                { id: receiverId, name: receiverFullName, avatar: receiverAvatar },
              ],
              messages: [
                {
                  sender: { id: senderId },
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
            "sender.id": senderId,
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
              { "sender.id": senderId, "receiver.id": receiverId },
              { $push: { messages: newMessage } },
            );
          } else {
            await Notification.create({
              sender: { id: senderId, name: userName },
              receiver: { id: receiverId, name: receiverFullName },
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
      senderId,
      userName,
      senderAvatar,
      receiverId,
      receiverFullName,
      receiverAvatar,
    } = data;

    // Sender side
    await User.findByIdAndUpdate(senderId, {
      $addToSet: {
        otherUsers: {
          id: receiverId,
          fullName: receiverFullName,
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
          id: senderId,
          fullName: userName,
          avatar: senderAvatar,
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
    const { senderId, receiverId, accept } = data;

    const relation = accept === 1 ? "friend" : "reject";

    // User side
    await User.findOneAndUpdate(
      { _id: senderId, "otherUsers.id": receiverId },
      {
        $set: {
          "otherUsers.$.relation": relation,
          "otherUsers.$.participantType": "receiver",
        },
      },
    );
    // Receiver side
    await User.findOneAndUpdate(
      { _id: receiverId, "otherUsers.id": senderId },
      {
        $set: {
          "otherUsers.$.relation": relation,
          "otherUsers.$.participantType": "sender",
        },
      },
    );

    io.to(receiverId).emit("requestReply", { accept });
    io.to(senderId).emit("friends", {
      requestState: relation,
    });
  });

  // Storing sms for offline user
  socket.on("offline_User sms", async (data) => {
    const {
      senderId,
      userName,
      receiverId,
      receiverFullName,
      identifier,
      sms,
      fileName,
      fileType,
      fileData,
    } = data;

    io.to(senderId).emit("last message", { senderId: receiverId, sms });
    try {
      const existingNotification = await Notification.findOne({
        "sender.id": senderId,
        "receiver.id": receiverId,
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
          { "sender.id": senderId, "receiver.id": receiverId },
          { $push: { messages: newMessage } },
        );
      } else {
        await Notification.create({
          sender: { id: senderId, name: userName },
          receiver: { id: receiverId, name: receiverFullName },
          identifier,
          messages: [newMessage],
        });
      }
    } catch (error) {
      console.error("Error saving notification:", error);
    }
  });

  // Video call backend system
  socket.on("video-call", (receiverId) => {
    socket.to(receiverId).emit("joined");
  });

  socket.on("ice-candidate", (candidate, receiverId) => {
    socket.to(receiverId).emit("ice-candidate", candidate);
  });

  socket.on("offer", (offer, receiverId) => {
    socket.to(receiverId).emit("offer", offer);
  });

  socket.on("answer", (answer, receiverId) => {
    socket.to(receiverId).emit("answer", answer);
  });

  // Delete sms for everyone
  socket.on("delete-everyone", async (data) => {
    const { senderId, receiverId, identifier } = data;
    try {
      const chat = await Message.findOne({
        "users.id": { $all: [senderId, receiverId] },
      });

      if (!chat) {
        console.log("No chat found!");
        return;
      }

      const messageIndex = chat.messages.findIndex(
        (msg) => msg.identifier === identifier,
      );

      if (messageIndex === -1) {
        console.log("Message not found!");
        return;
      }

      chat.messages.splice(messageIndex, 1);

      await chat.save();
    } catch (error) {
      console.log(error);
    }
    io.to(receiverId).emit("delete", identifier);
  });

  // Delete only one user's sms
  socket.on("delete-me", async (data) => {
    const { senderId, receiverId, identifier, sender } = data;
    try {
      const chat = await Message.findOne({
        "users.id": { $all: [senderId, receiverId] },
      });
      if (!chat) {
        return;
      }
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
      io.to(member.id).emit("updateState", { senderId: member.id });
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
      senderId,
      userName,
      senderAvatar,
      receiverId,
      receiverFullName,
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
      senderId,
      identifier,
      fileName,
      fileType,
      fileData,
      sms,
    });
    let existingChat = await GroupMessage.findById(groupId);
    if (existingChat) {
      existingChat.messages.push({
        sender: { id: senderId },
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

    const [senderId, user] = entry;

    if (user.viewers?.length) {
      user.viewers.forEach((viewerId) => {
        const viewer = users[viewerId];
        if (!viewer) return;

        if (viewer.selectedUser === senderId) {
          io.to(viewer.socketId).emit("checkDisconnect", "offline");
        }

        viewer.viewers = viewer.viewers?.filter((id) => id !== senderId);
      });
    }

    delete users[senderId];
    console.log("usersDE", users);
  });
});

export { server };

// User Joined on chat and see how many people are seeing my account
// socket.on("new-user-joined", async (userId, userName) => {
//   socket.join(userId);
//   if (users[userId]) {
//     // Existing object ke preserve kore socketId update kora holo
//     users[userId].socketId = socket.id;
//     users[userId].name = userName;
//     // viewers check kore map kora holo
//     if (users[userId].viewers) {
//       users[userId].viewers.map((viewerId) => {
//         if (users[viewerId]?.selectedUser === userId) {
//           io.to(users[viewerId].id).emit("state", "online");
//         }
//       });
//     }
//   } else {
//     users[userId] = { id: userId, name: userName, socketId: socket.id };
//   }
//   console.log("Usersjoin", users);
// });

// // Check selected users are online or offline and relationship status, store previous sms,
// socket.on("reciever add", async ({ userId, receiverId, receiverName }) => {
//   try {
//     // send online or offline state
//     if (users[userId]) {
//       users[userId].selectedUser = receiverId;
//     }
//     if (users[receiverId]) {
//       if (users[receiverId].socketId) {
//         if (users[receiverId].viewers) {
//           users[receiverId].viewers.push(userId);
//         } else {
//           users[receiverId].viewers = [userId];
//         }
//         io.to(userId).emit("state", "online");
//       } else {
//         if (users[receiverId].viewers) {
//           users[receiverId].viewers.push(userId);
//         } else {
//           users[receiverId].viewers = [userId];
//         }
//         io.to(userId).emit("state", "offline");
//       }
//     } else {
//       console.log("Off");
//       users[receiverId] = {
//         id: receiverId,
//         name: receiverName,
//         viewers: [userId],
//         socketId: null,
//       };
//       console.log("users", users);
//       io.to(userId).emit("state", "offline");
//     }
//     const otherUsers = await User.findById(userId);

//     console.log("usersoth", otherUsers);

//     const userList = Array.isArray(otherUsers?.otherUsers)
//       ? otherUsers.otherUsers
//       : [];

//     if (userList.length > 0) {
//       let found = false;
//       for (const user of userList) {
//         if (user.id.toString() === receiverId) {
//           found = true;
//           if (user.relation === "reject") {
//             io.to(userId).emit("friends", {
//               requestState: "reject",
//               participantType: user.participantType,
//             });
//           } else if (user.relation === "sent") {
//             io.to(userId).emit("friends", {
//               requestState: "sent",
//               participantType: user.participantType,
//             });
//           } else if (user.relation === "friend") {
//             io.to(userId).emit("requestSender", {
//               data: user.participantType === "sender" ? "sender" : "receiver",
//             });
//             io.to(userId).emit("friends", { requestState: "friend" });
//             const chatData = await Message.findOne({
//               users: {
//                 $all: [
//                   { $elemMatch: { id: userId } },
//                   { $elemMatch: { id: receiverId } },
//                 ],
//               },
//             });
//             if (chatData?.messages) {
//               for (const message of chatData.messages) {
//                 io.to(userId).emit("storedSms", message);
//               }
//             }
//           }
//           break;
//         }
//       }
//       if (!found) {
//         io.to(userId).emit("friends", { requestState: "noFriend" });
//       }
//     } else {
//       io.to(userId).emit("friends", { requestState: "noFriend" });
//     }
//   } catch (error) {
//     console.error("Socket Error:", error);
//   }
// });

// socket.on("check after reload", ({ userId, receiverId }) => {
//   if (users[receiverId] && users[receiverId].socketId) {
//     if (users[receiverId].viewers) {
//       users[receiverId].viewers.push(userId);
//     } else {
//       users[receiverId].viewers = [userId];
//     }
//     io.to(userId).emit("state", "online");
//   } else {
//     users[receiverId] = { viewers: [userId], socketId: null };
//     io.to(userId).emit("state", "offline");
//   }
// });

// // Sending message system
// socket.on("send message", async (data) => {
//   try {
//     const {
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
//       fileBuffer,
//     } = data;
//     let buf;
//     if (fileBuffer) {
//       buf = Buffer.from(fileBuffer);
//       const filePath = path.join(__dirname, "uploads", fileName);
//       fs.writeFileSync(filePath, buf);
//     }
//     if (buf) {
//       io.to(userId).emit("last message", {
//         userId: receiverId,
//         sms,
//         fileType,
//         fileName,
//       });
//       io.to(receiverId).emit("last message", {
//         userId: userId,
//         sms,
//         fileType,
//         fileName,
//       });
//     } else {
//       io.to(userId).emit("last message", { userId: receiverId, sms });
//       io.to(receiverId).emit("last message", { userId: userId, sms });
//     }
//     if (users[receiverId]) {
//       if (users[receiverId].selectedUser === userId) {
//         io.to(receiverId).emit("receive message", {
//           identifier,
//           fileName,
//           fileType,
//           buf,
//           sms,
//         });
//         let existingChat = await Message.findOne({
//           "users.id": { $all: [userId, receiverId] },
//         });
//         if (existingChat) {
//           existingChat.messages.push({
//             sender: { id: userId },
//             reciever: { id: receiverId },
//             relation: "friend",
//             identifier: identifier,
//             text: sms,
//             sender_delete: false,
//             reciever_delete: false,
//             file: {
//               fileName,
//               fileType,
//               fileData: buf,
//             },
//             timestamp: Date.now(),
//           });
//           await existingChat.save();
//         } else {
//           let newChat = new Message({
//             users: [
//               { id: userId, name: userName, avatar: userAvatar },
//               { id: receiverId, name: receiverName, avatar: receiverAvatar },
//             ],
//             messages: [
//               {
//                 sender: { id: userId },
//                 reciever: { id: receiverId },
//                 relation: "friend",
//                 identifier,
//                 text: sms,
//                 sender_delete: false,
//                 reciever_delete: false,
//                 file: {
//                   fileName,
//                   fileType,
//                   fileData: buf,
//                 },
//                 timestamp: Date.now(),
//               },
//             ],
//           });
//           await newChat.save();
//         }
//       }
//     } else {
//       try {
//         const existingNotification = await Notification.findOne({
//           "sender.id": userId,
//           "receiver.id": receiverId,
//         });

//         const newMessage = {
//           identifier,
//           text: sms,
//           file: fileName ? { fileName, fileType, buf } : undefined,
//           sender_delete: false,
//           timestamp: Date.now(),
//         };
//         if (existingNotification) {
//           await Notification.updateOne(
//             { "sender.id": userId, "receiver.id": receiverId },
//             { $push: { messages: newMessage } },
//           );
//         } else {
//           await Notification.create({
//             sender: { id: userId, name: userName },
//             receiver: { id: receiverId, name: receiverName },
//             identifier,
//             messages: [newMessage],
//           });
//         }
//       } catch (error) {
//         console.error("Error saving notification:", error);
//       }
//     }
//   } catch (err) {
//     console.error("Message Transfer Error:", err);
//   }
// });

// // Sending Friend Request
// socket.on("sendRequest", async (data) => {
//   const {
//     userId,
//     userName,
//     userAvatar,
//     receiverId,
//     receiverName,
//     receiverAvatar,
//   } = data;

//   // Sender side
//   await User.findByIdAndUpdate(userId, {
//     $addToSet: {
//       otherUsers: {
//         id: receiverId,
//         fullName: receiverName,
//         avatar: receiverAvatar,
//         relation: "sent",
//         participantType: "sender",
//       },
//     },
//   });

//   // Receiver side
//   await User.findByIdAndUpdate(receiverId, {
//     $addToSet: {
//       otherUsers: {
//         id: userId,
//         fullName: userName,
//         avatar: userAvatar,
//         relation: "sent",
//         participantType: "receiver",
//       },
//     },
//   });

//   io.to(receiverId).emit("friends", {
//     requestState: "sent",
//     participantType: "receiver",
//   });
// });

// // Accept Friend Request
// socket.on("acceptRequest", async (data) => {
//   const { userId, receiverId, accept } = data;

//   const relation = accept === 1 ? "friend" : "reject";

//   // User side
//   await User.findOneAndUpdate(
//     { _id: userId, "otherUsers.id": receiverId },
//     {
//       $set: {
//         "otherUsers.$.relation": relation,
//         "otherUsers.$.participantType": "receiver",
//       },
//     },
//   );
//   // Receiver side
//   await User.findOneAndUpdate(
//     { _id: receiverId, "otherUsers.id": userId },
//     {
//       $set: {
//         "otherUsers.$.relation": relation,
//         "otherUsers.$.participantType": "sender",
//       },
//     },
//   );

//   io.to(receiverId).emit("requestReply", { accept });
//   io.to(userId).emit("friends", {
//     requestState: relation,
//   });
// });

// // Storing sms for offline user
// socket.on("offline_User sms", async (data) => {
//   const {
//     OwnId,
//     OwnName,
//     ToId,
//     ToName,
//     identifier,
//     sms,
//     fileName,
//     fileType,
//     fileData,
//   } = data;

//   io.to(OwnId).emit("last message", { userId: ToId, sms });
//   try {
//     const existingNotification = await Notification.findOne({
//       "sender.id": OwnId,
//       "receiver.id": ToId,
//     });

//     const newMessage = {
//       identifier,
//       text: sms,
//       file: fileName ? { fileName, fileType, fileData } : undefined,
//       sender_delete: false,
//       timestamp: Date.now(),
//     };

//     if (existingNotification) {
//       await Notification.updateOne(
//         { "sender.id": OwnId, "receiver.id": ToId },
//         { $push: { messages: newMessage } },
//       );
//     } else {
//       await Notification.create({
//         sender: { id: OwnId, name: OwnName },
//         receiver: { id: ToId, name: ToName },
//         identifier,
//         messages: [newMessage],
//       });
//     }
//   } catch (error) {
//     console.error("Error saving notification:", error);
//   }
// });

// // Video call backend system
// socket.on("video-call", (ToId) => {
//   socket.to(ToId).emit("joined");
// });

// socket.on("ice-candidate", (candidate, ToId) => {
//   socket.to(ToId).emit("ice-candidate", candidate);
// });

// socket.on("offer", (offer, ToId) => {
//   socket.to(ToId).emit("offer", offer);
// });

// socket.on("answer", (answer, ToId) => {
//   socket.to(ToId).emit("answer", answer);
// });

// // Delete sms for everyone
// socket.on("delete-everyone", async (data) => {
//   const { OwnId, ToId, identifier } = data;
//   try {
//     // Step 1: Find the document
//     const chat = await Message.findOne({
//       "users.id": { $all: [OwnId, ToId] },
//     });

//     if (!chat) {
//       console.log("No chat found!");
//       return;
//     }

//     // Step 2: Find the index of the message with the given identifier
//     const messageIndex = chat.messages.findIndex(
//       (msg) => msg.identifier === identifier,
//     );

//     if (messageIndex === -1) {
//       console.log("Message not found!");
//       return;
//     }

//     // Step 3: Remove the message from the array
//     chat.messages.splice(messageIndex, 1);

//     // Step 4: Save the updated document
//     await chat.save();
//   } catch (error) {
//     console.log(error);
//   }
//   io.to(ToId).emit("delete", identifier); // Successfully deleted
// });

// // Delete only one user's sms
// socket.on("delete-me", async (data) => {
//   const { OwnId, ToId, identifier, sender } = data;
//   try {
//     // Step 1: Find the document
//     const chat = await Message.findOne({
//       "users.id": { $all: [OwnId, ToId] },
//     });
//     if (!chat) {
//       return;
//     }
//     // Step 2: Find the index of the message with the given identifier
//     const message = chat.messages.find(
//       (msg) => msg.identifier === identifier,
//     );
//     if (!message) {
//       return;
//     }
//     if (sender === "You") {
//       message.sender_delete = true;
//     } else {
//       message.reciever_delete = true;
//     }
//     if (message.sender_delete && message.reciever_delete) {
//       chat.messages = chat.messages.filter(
//         (msg) => msg.identifier !== identifier,
//       );
//     }
//     // Step 4: Save the updated document
//     await chat.save();
//   } catch (error) {
//     console.log(error);
//   }
// });

// socket.on("groupClick", async (data) => {
//   const { groupMembers, groupId } = data;
//   socket.join(groupId);
//   const onlineMember = groupMembers.map((member) => {
//     if (users[member.id]) {
//       return member;
//     }
//   });

//   const groupMessages =
//     await GroupMessage.findById(groupId).select("messages");
//   io.to(groupId).emit("onlineMember", onlineMember);
//   for (const member of onlineMember) {
//     io.to(member.id).emit("updateState", { userId: member.id });
//   }
//   groupMessages.map((message) => {
//     io.to(groupId).emit("groupStoredMessages", {
//       senderId: message.sender.id,
//       name: message.sender.name,
//       avatar: message.sender.avatar,
//       identifier: message.sender.identifier,
//       text: message.text,
//       file: message.file,
//     });
//   });
// });

// socket.on("send groupMessage", async () => {
//   const {
//     groupId,
//     userId,
//     userName,
//     userAvatar,
//     receiverId,
//     receiverName,
//     receiverAvatar,
//     identifier,
//     sms,
//     fileName,
//     fileType,
//     fileData,
//   } = data;
//   if (fileData) {
//     const filePath = path.join(__dirname, "uploads", fileName);
//     fs.writeFileSync(filePath, Buffer.from(fileData));
//   }
//   io.to(receiverId).emit("receive groupMessage", {
//     senderId: userId,
//     identifier,
//     fileName,
//     fileType,
//     fileData,
//     sms,
//   });
//   let existingChat = await GroupMessage.findById(groupId);
//   if (existingChat) {
//     existingChat.messages.push({
//       sender: { id: userId },
//       identifier: identifier,
//       text: sms,
//       sender_delete: false,
//       reciever_delete: [],
//       file: {
//         fileName,
//         fileType,
//         fileData,
//       },
//       timestamp: Date.now(),
//     });
//     await existingChat.save();
//   }
// });

// // Disconnection system
// socket.on("disconnect", () => {
//   const entry = Object.entries(users).find(
//     ([_, user]) => user.socketId === socket.id,
//   );

//   if (!entry) return;

//   const [userId, user] = entry;

//   if (user.viewers?.length) {
//     user.viewers.forEach((viewerId) => {
//       const viewer = users[viewerId];
//       if (!viewer) return;

//       if (viewer.selectedUser === userId) {
//         io.to(viewer.socketId).emit("checkDisconnect", "offline");
//       }

//       viewer.viewers = viewer.viewers?.filter((id) => id !== userId);
//     });
//   }

//   delete users[userId];
//   console.log("usersDE", users);
// });