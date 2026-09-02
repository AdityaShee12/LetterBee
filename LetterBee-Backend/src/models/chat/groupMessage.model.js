import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    receiver: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],

    textSms: {
      type: String,
      trim: true
    },

    file: [
      {
        fileName: String,
        fileType: String,
        fileUrl: String
      }
    ],

    sender_deleteForMe: {
      type: Boolean,
      default: false
    },

    sender_deleteForEveryone: {
      type: Boolean,
      default: false
    },

    receiver_delete: [
      {
        type: Boolean,
        default: false
      }
    ],
  },
  {
    timestamps: true
  }
);

export const Message =
  mongoose.model("Message", messageSchema);