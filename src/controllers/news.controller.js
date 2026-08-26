const axios = require("axios");
const crypto = require("crypto");
const User = require("../models/user.model");

// ------------------------------------
// Helpers
// ------------------------------------

const generateArticleId = (article) => {
    const identifier =
        article.url ||
        article.title ||
        `${article.source?.name || ""}-${article.publishedAt || ""}`;

    return crypto
        .createHash("sha256")
        .update(identifier)
        .digest("hex");
};

const isValidArticleId = (id) => {
    return (
        typeof id === "string" &&
        /^[a-f0-9]{64}$/i.test(id)
    );
};

const normalizeArticle = (article) => {
    return {
        id: generateArticleId(article),
        source: article.source || null,
        author: article.author || null,
        title: article.title || "",
        description: article.description || "",
        url: article.url || "",
        urlToImage: article.urlToImage || null,
        publishedAt: article.publishedAt || null,
        content: article.content || null,
    };
};

// ------------------------------------
// GET /news
// ------------------------------------

const getNews = async (req, res) => {
    try {
        // ------------------------------------
        // Validate environment configuration
        // ------------------------------------

        const newsApiUrl = process.env.NEWS_API_URL;
        const newsApiKey = process.env.NEWS_API_KEY;

        if (!newsApiUrl) {
            console.error("Configuration error: NEWS_API_URL is missing");

            return res.status(500).json({
                message: "News API URL is not configured",
            });
        }

        if (!newsApiKey) {
            console.error("Configuration error: NEWS_API_KEY is missing");

            return res.status(500).json({
                message: "News API key is not configured",
            });
        }

        // ------------------------------------
        // Validate query parameters
        // ------------------------------------

        const {
            page = 1,
            limit = 10,
            q,
        } = req.query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1 ||
            !Number.isInteger(limitNumber) ||
            limitNumber < 1 ||
            limitNumber > 100
        ) {
            return res.status(400).json({
                message:
                    "Page must be a positive integer and limit must be between 1 and 100",
            });
        }

        if (
            q !== undefined &&
            (typeof q !== "string" || q.trim().length === 0)
        ) {
            return res.status(400).json({
                message: "Search query must be a non-empty string",
            });
        }

        // ------------------------------------
        // Get user preferences
        // ------------------------------------

        const user = await User.findById(
            req.user.userId
        ).select("preferences");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const categories =
            Array.isArray(user.preferences?.categories)
                ? user.preferences.categories
                : [];

        const languages =
            Array.isArray(user.preferences?.languages)
                ? user.preferences.languages
                : [];

        let searchQuery = q?.trim();

        // Use preferred categories when no search query exists
        if (!searchQuery && categories.length > 0) {
            searchQuery = categories.join(" OR ");
        }

        const params = {
            page: pageNumber,
            pageSize: limitNumber,
        };

        if (searchQuery) {
            params.q = searchQuery;
        }

        // NewsAPI accepts a single language
        if (languages.length > 0) {
            params.language = languages[0];
        }

        // ------------------------------------
        // Fetch news
        // ------------------------------------

        const response = await axios.get(newsApiUrl, {
            headers: {
                "X-Api-Key": newsApiKey,
            },
            params,
            timeout: 10000,
        });

        const articles = Array.isArray(response.data?.articles)
            ? response.data.articles.map(normalizeArticle)
            : [];

        return res.status(200).json({
            message: "News fetched successfully",
            totalResults: response.data?.totalResults || 0,
            page: pageNumber,
            limit: limitNumber,
            articles,
        });
    } catch (error) {
        console.error(
            "News API error:",
            error.response?.data || error.message
        );

        // External API returned an error
        if (error.response) {
            return res.status(502).json({
                message:
                    error.response.data?.message ||
                    "Failed to fetch news from external API",
            });
        }

        // Request timeout
        if (error.code === "ECONNABORTED") {
            return res.status(504).json({
                message: "News API request timed out",
            });
        }

        // Unexpected server/network error
        return res.status(500).json({
            message: "Failed to fetch news",
        });
    }
};

// ------------------------------------
// POST /news/:id/read
// ------------------------------------

const markNewsAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate article ID
        if (!isValidArticleId(id)) {
            return res.status(400).json({
                message: "Invalid news article ID",
            });
        }

        const article = req.body;

        if (
            !article ||
            typeof article !== "object" ||
            Array.isArray(article)
        ) {
            return res.status(400).json({
                message: "Article data is required",
            });
        }

        const normalizedArticle = normalizeArticle(article);

        // Make sure URL/title exists so the ID represents
        // a real article.
        if (
            !normalizedArticle.url &&
            !normalizedArticle.title
        ) {
            return res.status(400).json({
                message:
                    "Article must contain at least a URL or title",
            });
        }

        // Prevent client from saving a different ID
        // than the article actually represents.
        if (normalizedArticle.id !== id) {
            return res.status(400).json({
                message: "Article ID does not match article data",
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                $addToSet: {
                    readNews: normalizedArticle,
                },
            },
            {
                new: true,
                select: "readNews",
            }
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message: "News article marked as read",
            article: normalizedArticle,
        });
    } catch (error) {
        console.error(
            "Mark news as read error:",
            error
        );

        return res.status(500).json({
            message: "Failed to mark news article as read",
        });
    }
};

// ------------------------------------
// POST /news/:id/favorite
// ------------------------------------

const markNewsAsFavorite = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate article ID
        if (!isValidArticleId(id)) {
            return res.status(400).json({
                message: "Invalid news article ID",
            });
        }

        const article = req.body;

        if (
            !article ||
            typeof article !== "object" ||
            Array.isArray(article)
        ) {
            return res.status(400).json({
                message: "Article data is required",
            });
        }

        const normalizedArticle = normalizeArticle(article);

        if (
            !normalizedArticle.url &&
            !normalizedArticle.title
        ) {
            return res.status(400).json({
                message:
                    "Article must contain at least a URL or title",
            });
        }

        if (normalizedArticle.id !== id) {
            return res.status(400).json({
                message: "Article ID does not match article data",
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                $addToSet: {
                    favoriteNews: normalizedArticle,
                },
            },
            {
                new: true,
                select: "favoriteNews",
            }
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message: "News article added to favorites",
            article: normalizedArticle,
        });
    } catch (error) {
        console.error(
            "Mark news as favorite error:",
            error
        );

        return res.status(500).json({
            message: "Failed to favorite news article",
        });
    }
};

// ------------------------------------
// GET /news/read
// ------------------------------------

const getReadNews = async (req, res) => {
    try {
        const user = await User.findById(
            req.user.userId
        ).select("readNews");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message: "Read news retrieved successfully",
            articles: user.readNews || [],
        });
    } catch (error) {
        console.error(
            "Get read news error:",
            error
        );

        return res.status(500).json({
            message: "Failed to retrieve read news",
        });
    }
};

// ------------------------------------
// GET /news/favorites
// ------------------------------------

const getFavoriteNews = async (req, res) => {
    try {
        const user = await User.findById(
            req.user.userId
        ).select("favoriteNews");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message:
                "Favorite news retrieved successfully",
            articles: user.favoriteNews || [],
        });
    } catch (error) {
        console.error(
            "Get favorite news error:",
            error
        );

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