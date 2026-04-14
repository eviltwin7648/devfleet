"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("./auth.controller");
const router = express_1.default.Router();
//manual authentication routes
router.post("/send-otp", auth_controller_1.authController.handleSendOtp);
router.post("/verify-otp", auth_controller_1.authController.verifyOtp);
router.post("/register", auth_controller_1.authController.register);
router.post("/login", auth_controller_1.authController.login);
router.post("/logout", auth_controller_1.authController.logout);
//github Oauth routes
router.get("/github", auth_controller_1.authController.githubAuth);
router.get("/github/callback", auth_controller_1.authController.githubCallback);
router.get("/me", auth_controller_1.authController.validateAuth);
//generate api key
exports.authRoutes = router;
