const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    preferences: {
      categories: {
        type: [String],
        enum: [
          "technology",
          "business",
          "sports",
          "entertainment",
          "health",
          "science",
        ],
        default: [],
      },

      languages: {
        type: [String],
        enum: ["en", "hi"],
        default: [],
      },
    },

    readNews: {
      type: [
        {
          id: {
            type: String,
            required: true,
          },
          source: {
            type: Object,
          },
          author: {
            type: String,
            default: null,
          },
          title: {
            type: String,
            required: true,
          },
          description: {
            type: String,
            default: "",
          },
          url: {
            type: String,
            default: "",
          },
          urlToImage: {
            type: String,
            default: null,
          },
          publishedAt: {
            type: String,
            default: null,
          },
          content: {
            type: String,
            default: null,
          },
        },
      ],
      default: [],
    },

    favoriteNews: {
      type: [
        {
          id: {
            type: String,
            required: true,
          },
          source: {
            type: Object,
          },
          author: {
            type: String,
            default: null,
          },
          title: {
            type: String,
            required: true,
          },
          description: {
            type: String,
            default: "",
          },
          url: {
            type: String,
            default: "",
          },
          urlToImage: {
            type: String,
            default: null,
          },
          publishedAt: {
            type: String,
            default: null,
          },
          content: {
            type: String,
            default: null,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;