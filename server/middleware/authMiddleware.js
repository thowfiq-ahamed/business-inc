const { verifyToken } = require('../utils/generateToken');

const authMiddleware = (req, res, next) => {
  try {
    const [scheme, token] = req.headers.authorization?.split(' ') || [];

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};

module.exports = authMiddleware;
