/** @format */

const { Router } = require("express");
const indexRouter = Router();

// Root route - serves homepage or welcome message
indexRouter.get("/", (req, res) => {
	res.send("Welcome to your project! Edit this route in indexRouter.js.");
});

// Health check route - useful for uptime monitoring
indexRouter.get("/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date() });
});

// About route - renders the about page
indexRouter.get("/about", (req, res) => {
	res.render("aboutPage", { currentPage: "about" });
});

indexRouter.get("/contact", (req, res) => {
	res.render("contact", { currentPage: "contact" });
});

indexRouter.get("/index", (req, res) => {
	res.render("index", { currentPage: "index" });
});

// Example placeholder for future custom routes
// indexRouter.get("/example", (req, res) => {
//     res.send("This is an example route.");
// });

module.exports = indexRouter;
