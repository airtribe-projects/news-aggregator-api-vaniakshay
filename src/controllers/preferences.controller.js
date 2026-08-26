const User = require("../models/user.model");

// ------------------------------------
// GET /preferences
// ------------------------------------

const getPreferences = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        const user = await User.findById(userId).select(
            "preferences"
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            preferences: user.preferences,
        });
    } catch (error) {
        console.error("Get preferences error:", error);

        return res.status(500).json({
            message: "Failed to retrieve preferences",
        });
    }
};

// ------------------------------------
// PUT /preferences
// ------------------------------------

const updatePreferences = async (req, res) => {
    try {
        const userId = req.user?.userId;

        // Validate authentication data
        if (!userId) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        // Validate request body
        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body)
        ) {
            return res.status(400).json({
                message: "Request body must be an object",
            });
        }

        const { categories, languages } = req.body;

        // At least one preference must be provided
        if (
            categories === undefined &&
            languages === undefined
        ) {
            return res.status(400).json({
                message:
                    "At least one of categories or languages is required",
            });
        }

        // ------------------------------------
        // Validate categories
        // ------------------------------------

        if (categories !== undefined) {
            if (!Array.isArray(categories)) {
                return res.status(400).json({
                    message: "Categories must be an array",
                });
            }

            if (
                !categories.every(
                    (category) =>
                        typeof category === "string" &&
                        category.trim().length > 0
                )
            ) {
                return res.status(400).json({
                    message:
                        "Categories must contain only non-empty strings",
                });
            }
        }

        // ------------------------------------
        // Validate languages
        // ------------------------------------

        if (languages !== undefined) {
            if (!Array.isArray(languages)) {
                return res.status(400).json({
                    message: "Languages must be an array",
                });
            }

            if (
                !languages.every(
                    (language) =>
                        typeof language === "string" &&
                        language.trim().length > 0
                )
            ) {
                return res.status(400).json({
                    message:
                        "Languages must contain only non-empty strings",
                });
            }
        }

        // ------------------------------------
        // Find user
        // ------------------------------------

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // ------------------------------------
        // Update only provided fields
        // ------------------------------------

        const currentPreferences = user.preferences || {};

        user.preferences = {
            categories:
                categories !== undefined
                    ? categories.map((category) =>
                          category.trim()
                      )
                    : currentPreferences.categories || [],

            languages:
                languages !== undefined
                    ? languages.map((language) =>
                          language.trim().toLowerCase()
                      )
                    : currentPreferences.languages || [],
        };

        await user.save();

        return res.status(200).json({
            message: "Preferences updated successfully",
            preferences: user.preferences,
        });
    } catch (error) {
        console.error("Update preferences error:", error);

        return res.status(500).json({
            message: "Failed to update preferences",
        });
    }
};

module.exports = {
    getPreferences,
    updatePreferences,
};