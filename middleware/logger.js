function logger (req, res, next) {
    console.log(`Request type: ${req.method}`)
    console.log(`Request url: ${req.url}`)
    next();
}

module.exports = logger;