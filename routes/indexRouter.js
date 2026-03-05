/** @format */

const { Router } = require("express");
const indexRouter = Router();

// Gallery route
indexRouter.get("/gallery", (req, res) => {
	// showWelcome: only for non-logged-in users; tracked in localStorage client-side
	res.render("index", {
		currentPage: "Gallery",
		pageTitle: "Gallery",
		user: req.user,
		stage: req.user ? "3" : "1",
		showWelcome: true, // client checks localStorage to decide whether to actually show it
	});
});

// Root redirect to gallery
indexRouter.get("/", (req, res) => {
	res.redirect(301, "/gallery");
});

indexRouter.get("/contact", (req, res) => {
	res.render("contact", { currentPage: "contact", pageTitle: "Contact", user: req.user, stage: req.user ? "3" : "1" });
});

indexRouter.get("/dashboard", (req, res) => {
	if (!req.user) {
		return res.redirect("/login");
	}
	res.render("dashboardPage", {
		currentPage: "dashboard",
		pageTitle: "Dashboard",
		user: req.user,
		stage: "3",
	});
});

indexRouter.get("/logout", (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			console.error("Error destroying session:", err);
			return res.status(500).send("Could not log out.");
		}
		res.redirect("/login");
	});
});

module.exports = indexRouter;
