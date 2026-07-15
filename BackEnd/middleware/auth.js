const { verifyJWT } = require("../utils/generateTokens");

const verifyUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Please sign in",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = await verifyJWT(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // store the full decoded payload, not just the id
    req.user = decoded; 
    next();
    
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = verifyUser;