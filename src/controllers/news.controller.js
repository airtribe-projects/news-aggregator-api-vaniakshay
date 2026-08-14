const axios = require("axios");
const User = require("../models/user.model");

const getNews = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            q,
        } = req.query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        const user = await User.findById(req.user.userId).select(
            "preferences"
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const categories = user.preferences?.categories || [];

        let searchQuery = q;

        // If no q is provided, use user's preferences
        if (!searchQuery && categories.length > 0) {
            searchQuery = categories.join(" OR ");
        }

        const params = {
            page: pageNumber,
            pageSize: limitNumber,
        };

        // Only add q when we have a search query
        if (searchQuery) {
            params.q = searchQuery;
        }

        const response = await axios.get(
            process.env.NEWS_API_URL,
            {
                headers: {
                    "X-Api-Key": process.env.NEWS_API_KEY,
                },
                params,
            }
        );

        res.status(200).json({
            message: "News fetched successfully",
            totalResults: response.data.totalResults,
            page: pageNumber,
            limit: limitNumber,
            articles: response.data.articles,
        });
    } catch (error) {
        console.error("News API error:", error.message);

        if (error.response) {
            return res.status(error.response.status).json({
                message:
                    error.response.data?.message ||
                    "Failed to fetch news",
            });
        }

        res.status(500).json({
            message: "Failed to fetch news",
        });
    }
};

module.exports = {
    getNews,
};