import mongoose, { Schema } from "mongoose";

const GroupMessageSchema = new mongoose.Schema({
  creator: { type: String, required: true },
  groupName: { type: String, required: true },
  groupAvatar: { type: String },
  groupAbout: { type: String },
  groupMembers: [
    {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      avatar: { type: String },
      about: { type: String },
      role: { type: String, required: true },
    },
  ],
  messages: [
    {
      sender: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
      identifier: { type: String, unique: true },
      text: { type: String },
      file: {
        fileName: { type: String },
        fileType: { type: String },
        fileData: { type: String },
      },
      sender_delete: { type: Boolean, default: false },
      receiver_delete: [{ type: String }],
      timestamp: { type: Date, default: Date.now }, // Message timestamp
    },
  ],
});

export const GroupMessage = mongoose.model("GroupMessage", GroupMessageSchema);
