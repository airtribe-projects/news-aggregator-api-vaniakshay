const express = require("express");

const {
    register,
    login,
    logout,
    updateUser,
    deleteUser,
} = require("../controllers/auth.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.post("/logout", authMiddleware, logout);
router.put("/update", authMiddleware, updateUser);
router.delete("/delete", authMiddleware, deleteUser);

module.exports = router;