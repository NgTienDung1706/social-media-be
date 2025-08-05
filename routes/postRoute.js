const router = require('express').Router()
const ctrls = require('../controllers/postController')
const auth = require('../middleware/auth');

router.get("/me", auth, ctrls.getMyPosts);

module.exports = router