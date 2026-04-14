import axios from "axios";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../../db/db";
import { generateOtp } from "../../lib/utils/generateOtp";
import { sendEmailOtp } from "../../lib/utils/sendEmailOtp";
dotenv.config();
const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const apiUrl = process.env.API_URL;
const frontendUrl = process.env.FRONTEND_URL;

const handleSendOtp = async (req: Request, res: Response) => {
  const otp = generateOtp();
  const email = req.body.email;
  try {
    const emailOTP = await db.emailOtp.upsert({
      create: {
        email: email,
        otp: otp.toString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        isVerified: false,
      },
      update: {
        otp: otp.toString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        isVerified: false,
      },
      where: {
        email: email,
      },
    });
    if (!emailOTP) {
      res.status(500).json({ message: "Failed to create or update OTP" });
      return;
    }

    await sendEmailOtp(email, otp.toString());

    res.status(200).json({
      message: "OTP sent successfully",
    });
    return;
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Error Sending OTP" });
    return;
  }
};

const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ message: "Email and OTP are required" });
      return;
    }

    const emailOtp = await db.emailOtp.findUnique({
      where: {
        email: email,
      },
    });

    if (!emailOtp) {
      res.status(404).json({ message: "OTP not found for this email" });
      return;
    }

    if (emailOtp.isVerified) {
      res.status(400).json({ message: "OTP already verified" });
      return;
    }

    if (emailOtp.otp !== otp) {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }

    if (new Date() > emailOtp.expiresAt) {
      res.status(400).json({ message: "OTP has expired" });
      return;
    }

    await db.emailOtp.update({
      where: { email: email },
      data: { isVerified: true },
    });

    res.status(200).json({ message: "OTP verified successfully" });
    return;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Error Verifying OTP" });
    return;
  }
};

const register = async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword, name } = req.body;

    if (!password || !confirmPassword) {
      res.status(400).json({
        message: "Password and confirm password are required",
      });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({
        message: "Entered Password and confirmed Password doesn't match",
      });
      return;
    }

    const emailOTP = await db.emailOtp.findFirst({
      where: { email },
    });

    if (!emailOTP) {
      res.status(404).json({ message: "No Such Verified Email Found" });
      return;
    }

    if (!emailOTP?.isVerified) {
      res.status(400).json({ message: "This email is not verified" });
      return;
    }

    const user = await db.user.findUnique({
      where: {
        email: email,
      },
    });
    if (user) {
      res
        .status(400)
        .json({ message: "An account with this User already exists." });
      return;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await db.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name: name,
        authProvider: "email",
      },
    });

    res.status(200).json({
      message: "User Created Successfully",
      user: {
        name: newUser.name,
        email: newUser.email,
      },
    });
    return;
  } catch (error) {
    console.error("Error Registering User", error);
    res.status(500).json({ message: "Error Registering User" });
    return;
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and Password are required" });
      return;
    }

    const user = await db.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if user registered with GitHub OAuth
    if (user.authProvider === "github" || !user.password) {
      res.status(400).json({
        message:
          "This account was created with GitHub. Please use GitHub login instead.",
      });
      return;
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
      },
    });
    return;
  } catch (error) {
    console.error("Error Logging In", error);
    res.status(500).json({ message: "Error Logging In" });
    return;
  }
};

const logout = async (req: Request, res: Response) => {
  try {
    res.cookie("auth_token", "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      expires: new Date(0), // Expire now
    });
    res.status(200).json({ message: "Logged out" });
  } catch (error) {}
};

const githubAuth = async (req: Request, res: Response) => {
  try {
    if (!clientId || !apiUrl) {
      res.status(500).json({
        message: "GitHub OAuth configuration is missing",
      });
      return;
    }
    const redirect_uri = `${apiUrl}/api/v1/auth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirect_uri}&scope=user`;
    res.redirect(githubAuthUrl);
    return;
  } catch (error) {
    console.error("Error during GitHub authentication:", error);
    res.status(500).json({ message: "Error during GitHub authentication" });
    return;
  }
};

const githubCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code) {
      res.status(400).json({ message: "Authorization code is required" });
      return;
    }
    if (!clientId || !clientSecret || !apiUrl) {
      res.status(500).json({
        message: "GitHub OAuth configuration is missing",
      });
      return;
    }

    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    const access_token = tokenResponse.data.access_token;
    if (!access_token) {
      res.status(400).json({ message: "Failed to obtain access token" });
      return;
    }

    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const githubUser = userResponse.data;
    console.log("GitHub User Data:", githubUser);

    // Get user email if not public
    let email = githubUser.email;
    if (!email) {
      const emailResponse = await axios.get(
        "https://api.github.com/user/emails",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        },
      );
      const primaryEmail = emailResponse.data.find(
        (email: any) => email.primary,
      );
      email = primaryEmail?.email;
    }

    if (!email) {
      res.redirect(
        `${frontendUrl}/login?error=No email found in GitHub profile`,
      );
      return;
    }

    // Check if user already exists by GitHub ID or email
    let user = await db.user.findFirst({
      where: {
        OR: [{ githubId: githubUser.id.toString() }, { email: email }],
      },
    });

    if (user) {
      // Update existing user with GitHub data if missing
      if (!user.githubId) {
        user = await db.user.update({
          where: { id: user.id },
          data: {
            githubId: githubUser.id.toString(),
            avatarUrl: githubUser.avatar_url,
            authProvider: "github",
          },
        });
      }
    } else {
      // Create new user
      user = await db.user.create({
        data: {
          email: email,
          name: githubUser.name || githubUser.login,
          githubId: githubUser.id.toString(),
          avatarUrl: githubUser.avatar_url,
          authProvider: "github",
        },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: false, // ⛔ only use true in production (HTTPS)
      sameSite: "lax", // or 'None' if frontend is on a different domain
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect(`${frontendUrl}/dashboard`);
    return;
  } catch (error) {
    console.error("Error in GitHub Callback", error);
    res.redirect(`${frontendUrl}/login?error=GitHub authentication failed`);
    return;
  }
};

const validateAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    // console.log("COOKIES", req.cookies);
    const token =
      req.cookies?.auth_token ||
      req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      res.status(401).json({ message: "No auth token provided" });
      return;
    }
    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch (err) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }
    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        authProvider: user.authProvider,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to validate auth", error: String(error) });
  }
};

export const authController = {
  handleSendOtp,
  verifyOtp,
  register,
  login,
  logout,
  githubAuth,
  githubCallback,
  validateAuth,
};
