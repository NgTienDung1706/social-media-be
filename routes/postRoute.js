const router = require("express").Router();
const ctrls = require("../controllers/postController");
const auth = require("../middleware/auth");

router.get("/me", auth, ctrls.getMyPosts);
router.get("/upload-signature", auth, ctrls.uploadSignature);
router.get("/:username", ctrls.getUserPostsByUsername);
router.post("/", auth, ctrls.createdPost);

module.exports = router;
