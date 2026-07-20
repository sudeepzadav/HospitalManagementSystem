const jwt = require("jsonwebtoken");

// ======================
// ACCESS TOKEN (LOGIN)
// ======================
function generateAcessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET);
}

// ======================
// REFRESH TOKEN
// ======================
function generateRefreshToken(payload){
    return jwt.sign(payload, process.env.REFRESH_SECRET);
}

// ======================
// EMAIL VERIFICATION TOKEN
// ======================
function generateVerificationToken(payload){
    return jwt.sign(payload, process.env.JWT_SECRET);
}

// ======================
// VERIFY TOKEN
// ======================
function verifyToken(payload){
    try {
        return jwt.verify(payload, process.env.JWT_SECRET)
    } catch (error) {
        console.log("JWT: verification failed", error.message);
        return null;
    }
}

module.exports = {
    generateAcessToken,
    generateRefreshToken,
    generateVerificationToken,
    verifyToken,
}