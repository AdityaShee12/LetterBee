import { asyncHandler } from "../../utils/handlers/asyncHandler.js"
import { ApiResponse } from "../../utils/response/ApiResponse.js";
import { ApiError } from "../../utils/response/ApiError.js"
import { User } from "../../models/user/user.model.js";
import { transporter } from "../../config/mail.config.js"
import { Otp } from "../../models/auth/otp.model.js";
import brevo from "../../utils/brevo/brevo.js";

const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required!",
    });
  }

  const user = await User.findOne({ email });

  if (user) {
    return res.status(400).json({
      message: "This email already has an account",
    });
  }

  const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

  const otp = generateOTP();

  try {
    // Send OTP using Brevo API
    await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: process.env.BREVO_SENDER_NAME,
        email: process.env.BREVO_SENDER_EMAIL,
      },

      to: [
        {
          email: email,
        },
      ],

      subject: "Your LetterBee OTP Code",

      htmlContent: `
        <div>
          <h2>Your OTP is: ${otp}</h2>
          <p>This OTP will expire in 5 minutes.</p>
        </div>
      `,
    });

    // Save OTP after email is successfully sent
    const OTP = await Otp.create({
      OTP: otp,
      email: email,
    });

    const responseData = {
      id: OTP._id,
    };

    return res.status(201).json(
      new ApiResponse(
        200,
        responseData,
        "Send otp successfully"
      )
    );
  } catch (error) {
    console.error("Brevo OTP Error:", error);

    return res.status(500).json({
      message: "Failed to send OTP",
    });
  }
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { id, otp } = req.body;
  const Id = await Otp.findById(id);
  let verified;

  if (Id.OTP === otp) {
    verified = 1;
    return res
      .status(200)
      .json(new ApiResponse(200, verified, "User verified Successfully"));
  } else {
    verified = 0;
    return res
      .status(400)
      .json(new ApiResponse(500, verified, "User gave wrong otp"));
  }
});

export {
  sendOtp,
  verifyOtp,
};
