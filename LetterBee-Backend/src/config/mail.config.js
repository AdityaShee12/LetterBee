import nodemailer from "nodemailer";

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sheeaditya12@gmail.com",
    pass: "jkyk bwqo zejm vuvf"
  },
});

export { transporter };

//process.env.EMAIL_USER,process.env.EMAIL_PASSWORD