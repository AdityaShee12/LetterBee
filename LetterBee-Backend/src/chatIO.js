import { app } from "./app.js";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { Conversation } from "./models/chat/conversation.model.js";
import { Message } from "./models/chat/message.model.js";
import { FriendRequest } from "./models/friendRequest/friendRequest.model.js";
import fs from "fs";
import dotenv from "dotenv";
import { FRONTEND_API } from "./Frontend_API.js";

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

let users = {};

io.on("connection", (socket) => {

  // User Joined on chat and see how many people are seeing my account
  socket.on("new-user-joined", async ({ senderId }) => {

    const presenceRoom = `presence:${senderId}`;

    socket.join(presenceRoom);

    socket.to(presenceRoom).emit("state", 1);

    if (senderId) {
      users[senderId] = {
        status: "online",
        socketId: socket.id,
      }
    }
  });

  // Check selected users are online or offline and relationship status, store previous sms,
  socket.on("reciever add", async ({ senderId, receiverId }) => {
    try {

      const targetPresenceRoom = `presence:${receiverId}`;

      socket.join(targetPresenceRoom);

      if (users[receiverId]?.status === "online") {
        socket.emit("state", 1);
      } else {
        socket.emit("state", 0);
      }

      const relation = await FriendRequest.findOne({
        $or: [
          { $or: [{ "sender.id": senderId }, { "receiver.id": receiverId }] },
          { $or: [{ "sender.id": receiverId }, { "receiver.id": senderId }] }
        ]
      });

      if (relation) {

        console.log("1");
        socket.emit("relation-status", { status: relation.status, sender: relation.sender.id });
      } else {

        console.log("2");
        socket.emit("relation-status", { status: "unknown" });
      }
    } catch (error) {
      console.error("Socket Error:", error);
    }
  });

  // Sending Friend Request
  socket.on("sendRequest", async (data) => {
    const {
      senderId,
      receiverId,
    } = data;
    console.log("GOBLU", senderId, receiverId);

    await FriendRequest.create({
      sender: { id: senderId },
      receiver: { id: receiverId },
      status: "pending"
    });

    // const presenceRoom = `presence:${receiverId}`;
    const roomExists = io.sockets.adapter.rooms.has(`presence:${receiverId}`);

    console.log("Data12", roomExists, senderId);

    const presenceRoom = `presence:${receiverId}`;

    socket.to(presenceRoom).emit("relation-status", {
      status: "pending",
      sender: senderId
    });
  });

  // Accept Friend Request
  socket.on("acceptRequest", async (data) => {

    const { senderId, receiverId, accept } = data;

    const relation = accept === 1 ? "accepted" : "rejected";

    await FriendRequest.findOneAndUpdate({ "sender.id": receiverId, "receiver.id": senderId },
      { $set: { status: relation } }
    )

    const presenceRoom = `presence:${receiverId}`;

    socket.to(presenceRoom).emit("relation-status", { status: relation, sender: senderId });
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
        receiverId,
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

      const presenceRoom1 = `presence:${senderId}`;
      const presenceRoom2 = `presence:${receiverId}`;

      if (buf) {
        socket.to(presenceRoom1).emit("last message", {
          senderId: receiverId,
          sms,
          fileType,
          fileName,
        });

        socket.to(presenceRoom2).emit("last message", {
          senderId: senderId,
          sms,
          fileType,
          fileName,
        });
      } else {
        console.log("SMS_WORK");
        socket.to(presenceRoom1).emit("last message", { senderId: receiverId, sms });
        socket.to(presenceRoom2).emit("last message", { senderId: senderId, sms });
      }

      const roomExists = io.sockets.adapter.rooms.has(presenceRoom2);

      socket.to(presenceRoom2).emit("receive message", { identifier, fileName, fileType, buf, sms });

      let conversation = await Conversation.findOne({
        participants: {
          $all: [senderId, receiverId]
        }
      });

      if (!conversation) {

        conversation = await Conversation.create({
          participants: [
            senderId, receiverId
          ]
        });
      }

      const conversationId = conversation._id;

      await Message.create({
        conversationId,
        sender: senderId,
        receiver: receiverId,
        textSms: sms ? sms : "",
        file: buf ? [
          {
            fileName,
            fileType,
            fileData: buf
          }
        ] : [],
        identifier,
      });
    } catch (err) {
      console.error("Message Transfer Error:", err);
    }
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
