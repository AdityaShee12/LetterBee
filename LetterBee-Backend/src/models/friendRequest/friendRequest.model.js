import mongoose, { Schema } from "mongoose";

const friendRequestSchema = new Schema(
    {
        sender: {
            id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        },

        receiver: {
            id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        },
        
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"]
        },
    },
    {
        timestamps: true
    }
);

export const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
