const express = require("express");
const {
    getPreferences,
    updatePreferences,
} = require("../controllers/preferences.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, getPreferences);
router.put("/", authMiddleware, updatePreferences);

module.exports = router;