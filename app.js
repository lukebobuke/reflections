/** @format */

//get port from env file
const port = process.env.PORT || 3000;

//import modules
const express = require("express");
const app = express();
require("dotenv").config();
const path = require("node:path");
const cors = require("cors");
const db = require("./models/db");

//import custom middleware
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

//import routers
const indexRouter = require("./routes/indexRouter");
const userRouter = require("./routes/userRouter");


//use EJS as template engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


//serve public files
app.use(express.static(__dirname + "/public"));

// This is a test connection to the database. It connects to the database and runs a simple query to check if the connection is successful.
// If successful, it logs the current date and time from the database.
db.pool.connect()
	.then(client => {
		return client.query("SELECT NOW()")
			.then(res => {
				console.log("Connected to the database:", res.rows);
				client.release();
			})
			.catch(err => {
				console.error("Error executing query:", err);
				client.release();
			});
	})
	.catch(err => {
		console.error("Error connecting to the database:", err);
	});

//middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//serve public files with CORS headers
app.use(
	express.static(path.join(__dirname, "public"), {
		setHeaders: (res, path) => {
			res.setHeader("Access-Control-Allow-Origin", "*");
		},
	})
);

//app-level custom middleware
app.use(logger);
app.use(errorHandler);

//use routers
// This is where the routers are mounted to the app. The userRouter handles all requests to /users
app.use("/users", userRouter);
app.use("/", indexRouter);

//serve 404 page
app.use((req, res) => {
	res.status(404).sendFile(path.join(__dirname, "public", "404.html")); // Fixed path concatenation
});

//bootstrap server
app.listen(port, () => {
	console.log(`My first Express app! Listening on port ${port}`);
}).on("error", (err) => {
	console.error("Failed to start server:", err); // Added error handling for server startup
});
