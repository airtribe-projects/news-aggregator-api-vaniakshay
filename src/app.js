const express = require("express");
const authRoutes = require("./routes/auth.routes");
const newsRoutes = require("./routes/news.routes");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes /

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/news", newsRoutes);

module.exports = app;
