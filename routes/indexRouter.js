/** @format */

const { Router } = require("express");
const indexRouter = Router();

// Root route - serves homepage or welcome message
indexRouter.get("/", (req, res) => {
	res.render("index", { currentPage: "home", user: req.user });
});

// About route - renders the about page
indexRouter.get("/about", (req, res) => {
	res.render("aboutPage", { currentPage: "about", user: req.user });
});

indexRouter.get("/contact", (req, res) => {
	res.render("contact", { currentPage: "contact", user: req.user });
});

// User home page route - renders the user home page after login/signup
indexRouter.get("/dashboard", (req, res) => {
	if (!req.user) {
		console.log("User not authenticated, redirecting to login.");
		return res.redirect("/login");
	}
	res.render("dashboardPage", { currentPage: "dashboard", user: req.user });
});

// Log out route - destroys the session and redirects to login
indexRouter.get("/logout", (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			console.error("Error destroying session:", err);
			return res.status(500).send("Could not log out.");
		}
		res.redirect("/login");
	});
});

// Example placeholder for future custom routes
// indexRouter.get("/example", (req, res) => {
//     res.send("This is an example route.");
// });

module.exports = indexRouter;
