const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { allowRoles } = require('./role.middleware');

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Access Denied" });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid Token" });
    
    try {
      const userId = decoded.userId || decoded.id;
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!dbUser) {
        return res.status(401).json({ error: "User no longer exists" }); 
      }
      if (dbUser.isActive === false) {
        return res.status(403).json({ error: "User account is inactive" });
      }

      req.user = {
        id: dbUser.id,
        userId: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        shopId: dbUser.shopId,
      };
      next();
    } catch (dbError) {
      console.error("Auth DB Error:", dbError);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
};

exports.requireRole = (roles) => {
  return allowRoles(roles);
};

exports.allowRoles = allowRoles;
