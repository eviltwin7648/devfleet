"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailOtp = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const sendEmailOtp = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("Missing email credentials in environment variables");
        throw new Error("Email configuration not found");
    }
    try {
        const transporter = nodemailer_1.default.createTransport({
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
        const result = yield transporter.sendMail(mailOptions);
        console.log("Email sent successfully to " + email, result.messageId);
        return result;
    }
    catch (error) {
        console.error("Error sending email:", error);
        throw new Error(`Failed to send email: ${error.message || error}`);
    }
});
exports.sendEmailOtp = sendEmailOtp;
