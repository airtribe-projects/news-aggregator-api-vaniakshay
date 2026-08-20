const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d",
        }
    );
};

// REGISTER
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log("Register request body:", req.body); // Log the request body for debugging

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        const token = generateToken(user._id);

        res.status(201).json({
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

        res.status(500).json({
            message: "Something went wrong",
        });
    }
};

// LOGIN
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
         console.log("Login request body:", req.body); // Log the request body for debugging
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({ email });

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

        res.status(200).json({
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

        res.status(500).json({
            message: "Something went wrong",
        });
    }
};

// LOGOUT
const logout = async (req, res) => {
    try {
        res.status(200).json({
            message: "Logout successful",
        });
    } catch (error) {
        console.error("Logout error:", error);

        res.status(500).json({
            message: "Something went wrong",
        });
    }
};

// UPDATE USER
const updateUser = async (req, res) => {
    try {
        const userId = req.user.userId;

        const { name, email, password, preferences } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (name !== undefined) {
            user.name = name;
        }

        if (email !== undefined) {
            const existingUser = await User.findOne({
                email,
                _id: { $ne: userId },
            });

            if (existingUser) {
                return res.status(409).json({
                    message: "Email is already in use",
                });
            }

            user.email = email;
        }

        if (password !== undefined) {
            user.password = await bcrypt.hash(password, 10);
        }

        if (preferences !== undefined) {
            user.preferences = preferences;
        }

        await user.save();

        res.status(200).json({
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

        res.status(500).json({
            message: "Something went wrong",
        });
    }
};

// DELETE USER
const deleteUser = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.status(200).json({
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("Delete user error:", error);

        res.status(500).json({
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