const router = require('express').Router()
const ctrls = require('../controllers/userController')
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
// const upload = require("../middlewares/multer");

//router.all("*", auth);

router.post('/login', ctrls.login);
router.post('/register', ctrls.register);
router.post('/verify-otp', ctrls.verifyOTP);
router.post('/forgot-password', ctrls.forgotPassword);
router.post('/verify-forgot-otp', ctrls.forgotPasswordOTP);
router.post('/reset-password', ctrls.resetPassword);


router.post('/home',auth, ctrls.login);

router.get("/profile", auth, ctrls.getProfile);
router.put('/profile', auth ,upload.single('avatar'), ctrls.updateProfile);

module.exports = router