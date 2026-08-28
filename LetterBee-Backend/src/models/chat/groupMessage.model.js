import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
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