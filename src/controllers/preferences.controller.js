const User = require("../models/user.model");

// GET /preferences
const getPreferences = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select(
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

// PUT /preferences
const updatePreferences = async (req, res) => {
    try {
        const { categories, languages } = req.body;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        user.preferences = {
            categories: categories ?? user.preferences?.categories ?? [],
            languages: languages ?? user.preferences?.languages ?? [],
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