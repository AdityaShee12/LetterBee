import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema(
    {
        OTP: {
            type: String,
            required: true,
        },
        email: {          
            type: String,
            required: true,
        }
    },
    { timestamps: true } 
);

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

export const Otp = mongoose.model("Otp", otpSchema);