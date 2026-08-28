import mongoose, { Schema } from "mongoose";

const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String
        },

        avatar: {
            type: String
        },

        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        bio: {
            type: String,
        },

        subject: {
            type: String,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Group = mongoose.model("Group", groupSchema);