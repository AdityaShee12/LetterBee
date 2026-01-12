import nodemailer from "nodemailer";
// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sheeaditya12@gmail.com",
    pass: "ncgi dgnx uike bjhm",
  },
});
console.log("Works");

export { transporter };
