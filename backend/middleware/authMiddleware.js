const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(403).json({ error: 'Invalid token format' });

  jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access_secret', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

const verifyRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

module.exports = { verifyToken, verifyRole };
