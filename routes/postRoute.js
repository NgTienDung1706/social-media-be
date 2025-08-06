const router = require('express').Router()
const ctrls = require('../controllers/postController')
const auth = require('../middleware/auth');

router.get("/me", auth, ctrls.getMyPosts);
router.get('/:username', auth, ctrls.getUserPostsByUsername);

module.exports = router