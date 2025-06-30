/** @format */
const userModel = require("../models/userModel");

async function populateUser(req, res, next) {
	try {
		console.log("populateUser: session.userId =", req.session && req.session.userId);
		const userId = req.session && req.session.userId;
		if (userId) {
			const user = await userModel.getUserById(userId);
			console.log("populateUser: user from DB =", user);
			if (user) {
				req.user = user;
			}
		}
	} catch (err) {
		console.error("Error populating req.user:", err);
	}
	next();
}

module.exports = populateUser;
