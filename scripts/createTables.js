/** @format */

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Minimal runner: reads migrations/001_create_tables.sql and runs it once.
// Usage: ensure DATABASE_URL is set, then `npm run create_tables`.

(async function main() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		console.error("DATABASE_URL is not set. Set DATABASE_URL and retry.");
		process.exit(2);
	}

	const sqlPath = path.join(__dirname, "..", "migrations", "001_create_tables.sql");
	if (!fs.existsSync(sqlPath)) {
		console.error("SQL file not found:", sqlPath);
		process.exit(1);
	}

	const sql = fs.readFileSync(sqlPath, "utf8");

	const pool = new Pool({
		connectionString: databaseUrl,
		ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
	});

	try {
		console.log(
			"Connecting to DB (masked):",
			(() => {
				try {
					const u = new URL(databaseUrl);
					return `${u.protocol}//${u.username}:****@${u.hostname}:${u.port || "5432"}/${u.pathname.slice(1)}`;
				} catch {
					return "DATABASE_URL (masked)";
				}
			})()
		);

		await pool.query(sql);
		console.log("SQL executed. Tables created (or already present if SQL used IF NOT EXISTS).");
		await pool.end();
		process.exit(0);
	} catch (err) {
		console.error("Failed to execute SQL:", err.message || err);
		try {
			await pool.end();
		} catch (_) {}
		process.exit(1);
	}
})();
