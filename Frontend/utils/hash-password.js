const crypto = require('crypto');

exports.hashPassword = (password) => {
    const sha256hash = crypto.createHash('sha256');
    const hashedPassword = sha256hash.update(password).digest('base64');
    return hashedPassword;
}