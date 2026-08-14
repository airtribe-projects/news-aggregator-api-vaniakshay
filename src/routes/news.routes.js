const express = require("express");

const { getNews } = require("../controllers/news.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, getNews);

module.exports = router;