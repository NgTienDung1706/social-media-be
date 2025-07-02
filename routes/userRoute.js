const router = require('express').Router()
const ctrls = require('../controllers/userController')
// const upload = require("../middlewares/multer");

router.post('/login', ctrls.login);

module.exports = router