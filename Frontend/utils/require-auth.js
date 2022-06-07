const path = require("path");

exports.requireAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        return res.render("login.html")
    }
};