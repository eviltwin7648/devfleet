import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendEmailOtp = async (email: string, otp: string) => {

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Missing email credentials in environment variables");
    throw new Error("Email configuration not found");
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: {
        name: "DevFleet",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: "Your OTP Code For DevFleet",
      text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
      html: `
    <div style="font-family:sans-serif; font-size:14px;">
      <p>Hello,</p>
      <p>Your <strong>DevFleet</strong> OTP code is:</p>
      <h2 style="color:#000;">${otp}</h2>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    </div>
  `,
    };

    console.log("Mail options created:", mailOptions);

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to " + email, result.messageId);

    return result;
  } catch (error: any) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error.message || error}`);
  }
};
