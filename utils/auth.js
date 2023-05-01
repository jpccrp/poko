const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '2m', // Keep the expiration at 2 minutes
      algorithm: 'HS256', // Specify the signing algorithm
    }
  );

  return token;
};

const verifyToken = (token) => {
  try {
    const tokenWithoutBearer = token.replace(/^Bearer\s+/, ''); // Remove the 'Bearer ' prefix
    const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
