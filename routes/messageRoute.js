const router = require("express").Router();
const auth = require("../middleware/auth.js");
const ctrls = require("../controllers/messageController.js");

router.use(auth);

router.post("/direct", ctrls.sendDirectMessage);
router.post("/group", ctrls.sendGroupMessage);

module.exports = router;
