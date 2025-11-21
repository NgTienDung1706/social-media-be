import express from "express";
const router = express.Router();
import * as ctrls from "../controllers/userController.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";
// const upload = require("../middlewares/multer");

//router.all("*", auth);

router.post("/login", ctrls.login);
router.post("/register", ctrls.register);
router.post("/verify-otp", ctrls.verifyOTP);
router.post("/forgot-password", ctrls.forgotPassword);
router.post("/verify-forgot-otp", ctrls.forgotPasswordOTP);
router.post("/reset-password", ctrls.resetPassword);

router.post("/home", auth, ctrls.login);

router.get("/profile", auth, ctrls.getProfile);
router.get("/profile/:username", auth, ctrls.getUserProfileByUsername);
router.get("/me", auth, ctrls.getMyInfo);
router.put("/profile", auth, upload.single("avatar"), ctrls.updateProfile);

router.get("/search", auth, ctrls.searchUsers);

router.post("/refresh-token", ctrls.refreshToken);
router.post("/logout", ctrls.logout);

export default router;
