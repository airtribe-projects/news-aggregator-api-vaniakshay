const axios = require("axios");
const User = require("../models/user.model");

const getNews = async (req, res) => {
  try {
    const { page = 1, limit = 10, q } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    // Validate pagination parameters
    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(limitNumber) ||
      limitNumber < 1
    ) {
      return res.status(400).json({
        message: "Page and limit must be positive integers",
      });
    }

    const user = await User.findById(req.user.userId).select("preferences");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const categories = user.preferences?.categories || [];
    const languages = user.preferences?.languages || [];

    let searchQuery = q;

    // Use user's preferred categories when no search query is provided
    if (!searchQuery && categories.length > 0) {
      searchQuery = categories.join(" OR ");
    }

    const params = {
      page: pageNumber,
      pageSize: limitNumber,
    };

    // Add search query when available
    if (searchQuery) {
      params.q = searchQuery;
    }

    // NewsAPI accepts a single language code
    if (languages.length > 0) {
      params.language = languages[0];
    }

    const response = await axios.get(process.env.NEWS_API_URL, {
      headers: {
        "X-Api-Key": process.env.NEWS_API_KEY,
      },
      params,
    });

    return res.status(200).json({
      message: "News fetched successfully",
      totalResults: response.data.totalResults,
      page: pageNumber,
      limit: limitNumber,
      articles: response.data.articles,
    });
  } catch (error) {
    console.error("News API error:", error.message);

    // Handle errors returned by the external News API
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data?.message || "Failed to fetch news",
      });
    }

    // Handle unexpected/server errors
    return res.status(500).json({
      message: "Failed to fetch news",
    });
  }
};

// POST /news/:id/read
const markNewsAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $addToSet: {
          readNews: id,
        },
      },
      {
        new: true,
        select: "readNews",
      },
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "News article marked as read",
    });
  } catch (error) {
    console.error("Mark news as read error:", error);

    return res.status(500).json({
      message: "Failed to mark news article as read",
    });
  }
};

// POST /news/:id/favorite
const markNewsAsFavorite = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $addToSet: {
          favoriteNews: id,
        },
      },
      {
        new: true,
        select: "favoriteNews",
      },
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "News article added to favorites",
    });
  } catch (error) {
    console.error("Mark news as favorite error:", error);

    return res.status(500).json({
      message: "Failed to favorite news article",
    });
  }
};

// GET /news/read
const getReadNews = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("readNews");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      articles: user.readNews,
    });
  } catch (error) {
    console.error("Get read news error:", error);

    return res.status(500).json({
      message: "Failed to retrieve read news",
    });
  }
};

// GET /news/favorites
const getFavoriteNews = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("favoriteNews");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      articles: user.favoriteNews,
    });
  } catch (error) {
    console.error("Get favorite news error:", error);

    return res.status(500).json({
      message: "Failed to retrieve favorite news",
    });
  }
};

module.exports = {
  getNews,
  markNewsAsRead,
  markNewsAsFavorite,
  getReadNews,
  getFavoriteNews,
};
