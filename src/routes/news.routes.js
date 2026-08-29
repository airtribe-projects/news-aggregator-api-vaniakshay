const express = require("express");

const {
  getNews,
  markNewsAsRead,
  markNewsAsFavorite,
  getReadNews,
  getFavoriteNews,
} = require("../controllers/news.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, getNews);
router.post("/:id/read", authMiddleware, markNewsAsRead);
router.post("/:id/favorite", authMiddleware, markNewsAsFavorite);

router.get("/read", authMiddleware, getReadNews);
router.get("/favorites", authMiddleware, getFavoriteNews);

module.exports = router;
