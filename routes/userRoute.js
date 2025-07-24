const router = require('express').Router()
const ctrls = require('../controllers/userController')
const auth = require('../middleware/auth');
// const upload = require("../middlewares/multer");

//router.all("*", auth);

router.post('/login', ctrls.login);
router.post('/register', ctrls.register);
router.post('/verify-otp', ctrls.verifyOTP);

router.post('/home',auth, ctrls.login);

router.get("/profile", auth, ctrls.getProfile);

module.exports = router