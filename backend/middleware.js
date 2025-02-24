const jwt = require("jsonwebtoken");

const { JWT_SECRET } = require("./config");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(403).json({
        message: "You are not authorized : No token Provided ",
      });
    }

    const token = authHeader.split(" ")[1]; //extract token
    const decode = jwt.verify(token, JWT_SECRET);

    req.userId = decode.userId; //Attaching userId to request
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Unauthorized: Invalid Token",
    });
  }
};

module.exports = {
  authMiddleware,
};
