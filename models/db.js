/** @format */

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Load environment variables from .env file
const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
});

// Query function
const query = (text, params) => pool.query(text, params);

console.log("Connecting to DB:", process.env.DB_NAME, "as user:", process.env.DB_USER);

module.exports = {
	pool,
	query,
};
