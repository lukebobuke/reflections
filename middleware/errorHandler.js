function errorHandler(err, req, res, next) {
    console.error(err.stack);
    if (req.accepts('json')) {
        res.status(500).json({ error: "Internal Server Error", message: err.message });
    } else {
        res.status(500).send("Something went wrong!");
    }
}
module.exports = errorHandler;