/** @format */
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");

//----------------------------------------------------------------------------------------------------
// #region Render Pages
//----------------------------------------------------------------------------------------------------
const renderLoginPage = (req, res) => {
	res.render("loginPage", { currentPage: "login", pageTitle: "Login", user: req.user, stage: "1" });
};

const renderSignupPage = (req, res) => {
	res.render("signupPage", { currentPage: "signup", pageTitle: "Sign Up", user: req.user, stage: "1" });
};
//----------------------------------------------------------------------------------------------------
// #endregion
//----------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------
// #region Create User
//----------------------------------------------------------------------------------------------------
const createUser = async (req, res) => {
	const name = req.body.name?.trim();
	const email = req.body.email?.trim().toLowerCase();

	if (!name || !email) {
		return res.status(400).send("Name and email are required.");
	}

	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10);
		await userModel.createUser({ name, email, password: hashedPassword });
		const user = await userModel.getUserByEmail(email);
		req.session.userId = user.id;
		// Flag: show pattern creation guide message on first landing
		req.session.isNewSignup = true;
		// Pattern is NOT locked yet on signup
		req.session.patternLocked = false;
		req.session.save(function (err) {
			if (err) console.error("Session save error:", err);
			res.redirect("/vault");
		});
	} catch (err) {
		if (err.code === "ECONNREFUSED" || (err.message && err.message.includes("ECONNREFUSED"))) {
			console.error("Database connection refused.", err);
			return res.status(502).send("Database unavailable");
		}
		if (err.code === "23505") {
			res.status(400).send("That email already exists.");
		} else if (err.code === "23502") {
			res.status(400).send("Name and email are required.");
		} else if (err.code === "23514") {
			res.status(400).send("Invalid email format.");
		} else if (err.code === "22001") {
			res.status(400).send("Input data is too long.");
		} else {
			console.error("Error creating user:", err);
			res.status(500).send("Internal Server Error");
		}
	}
};
//----------------------------------------------------------------------------------------------------
// #endregion
//----------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------
// #region Login User
//----------------------------------------------------------------------------------------------------
const login = async (req, res) => {
	const { email, password } = req.body;
	try {
		const user = await userModel.getUserByEmail(email);
		if (!user) {
			return res.status(401).send("Invalid email or password");
		}
		if (!user.password) {
			return res.status(500).send("Internal Server Error");
		}
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).send("Invalid email or password");
		}
		req.session.userId = user.id;
		req.session.save(function (err) {
			if (err) console.error("Session save error:", err);
			return res.redirect("/vault");
		});
	} catch (err) {
		console.error("Error logging in user:", err);
		res.status(500).send("Internal Server Error");
	}
};
//----------------------------------------------------------------------------------------------------
// #endregion
//----------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------
// #region Update User
//----------------------------------------------------------------------------------------------------
const updateUser = async (req, res) => {
	const userId = req.params.userId;
	const { name, email } = req.body;
	if (!name || !email) {
		return res.status(400).send("Name and email are required.");
	}
	try {
		await userModel.updateUser(userId, { name, email });
		res.redirect("/users");
	} catch (err) {
		console.error("Error updating user:", err);
		res.status(500).send("Internal Server Error");
	}
};
//----------------------------------------------------------------------------------------------------
// #endregion
//----------------------------------------------------------------------------------------------------

//----------------------------------------------------------------------------------------------------
// #region Delete User
//----------------------------------------------------------------------------------------------------
const deleteUser = async (req, res) => {
	const userId = req.params.userId;
	try {
		await userModel.deleteUser(userId);
		res.redirect("/users");
	} catch (err) {
		console.error("Error deleting user:", err);
		res.status(500).send("Internal Server Error");
	}
};
//----------------------------------------------------------------------------------------------------
// #endregion
//----------------------------------------------------------------------------------------------------

module.exports = { login, createUser, updateUser, deleteUser, renderLoginPage, renderSignupPage };
