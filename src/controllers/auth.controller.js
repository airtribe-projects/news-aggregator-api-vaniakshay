const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// -------------------------
// Validation helpers
// -------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Adjust this value if your assignment specifies a different minimum.
const MIN_PASSWORD_LENGTH = 8;

const isValidEmail = (email) => {
    return (
        typeof email === "string" &&
        EMAIL_REGEX.test(email.trim())
    );
};

const isValidPassword = (password) => {
    return (
        typeof password === "string" &&
        password.length >= MIN_PASSWORD_LENGTH
    );
};

/*
 * Expected preferences shape:
 *
 * {
 *   categories: ["technology", "sports"],
 *   language: "en"
 * }
 *
 * If your User model uses different preference fields,
 * update this validator to match the model schema.
 */
const isValidPreferences = (preferences) => {
    if (
        !preferences ||
        typeof preferences !== "object" ||
        Array.isArray(preferences)
    ) {
        return false;
    }

    if (
        preferences.categories !== undefined &&
        (
            !Array.isArray(preferences.categories) ||
            !preferences.categories.every(
                (category) => typeof category === "string"
            )
        )
    ) {
        return false;
    }

    if (
        preferences.language !== undefined &&
        typeof preferences.language !== "string"
    ) {
        return false;
    }

    return true;
};

const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }

    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d",
        }
    );
};

// -------------------------
// REGISTER
// -------------------------

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }

        if (typeof name !== "string" || name.trim().length < 2) {
            return res.status(400).json({
                message: "Name must be at least 2 characters long",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                message: "Please provide a valid email address",
            });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({
                message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
            });
        }

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
        });

        const token = generateToken(user._id);

        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences,
            },
        });
    } catch (error) {
        console.error("Register error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};

// -------------------------
// LOGIN
// -------------------------

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                message: "Please provide a valid email address",
            });
        }

        if (typeof password !== "string") {
            return res.status(400).json({
                message: "Password must be a string",
            });
        }

        const user = await User.findOne({
            email: normalizedEmail,
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences,
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};

// -------------------------
// LOGOUT
// -------------------------

const logout = async (req, res) => {
    try {
       
        return res.status(200).json({
            message: "Logout successful. Please remove the JWT from the client.",
        });
    } catch (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};

// -------------------------
// UPDATE USER
// -------------------------

const updateUser = async (req, res) => {
    try {
        const userId = req.user.userId;

        const {
            name,
            email,
            password,
            preferences,
        } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // -------------------------
        // Validate name
        // -------------------------

        if (name !== undefined) {
            if (
                typeof name !== "string" ||
                name.trim().length < 2
            ) {
                return res.status(400).json({
                    message: "Name must be at least 2 characters long",
                });
            }

            user.name = name.trim();
        }

        // -------------------------
        // Validate email
        // -------------------------

        if (email !== undefined) {
            if (typeof email !== "string") {
                return res.status(400).json({
                    message: "Email must be a string",
                });
            }

            const normalizedEmail = email.trim().toLowerCase();

            if (!isValidEmail(normalizedEmail)) {
                return res.status(400).json({
                    message: "Please provide a valid email address",
                });
            }

            const existingUser = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: userId },
            });

            if (existingUser) {
                return res.status(409).json({
                    message: "Email is already in use",
                });
            }

            user.email = normalizedEmail;
        }

        // -------------------------
        // Validate password
        // -------------------------

        if (password !== undefined) {
            if (!isValidPassword(password)) {
                return res.status(400).json({
                    message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
                });
            }

            user.password = await bcrypt.hash(password, 10);
        }

        // -------------------------
        // Validate preferences
        // -------------------------

        if (preferences !== undefined) {
            if (!isValidPreferences(preferences)) {
                return res.status(400).json({
                    message:
                        "Invalid preferences. Categories must be an array of strings and language must be a string.",
                });
            }

            user.preferences = preferences;
        }

        await user.save();

        return res.status(200).json({
            message: "User updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                preferences: user.preferences,
            },
        });
    } catch (error) {
        console.error("Update user error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};

// -------------------------
// DELETE USER
// -------------------------

const deleteUser = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("Delete user error:", error);

        return res.status(500).json({
            message: "Something went wrong",
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    updateUser,
    deleteUser,
};