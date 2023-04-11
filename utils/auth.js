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
      expiresIn: '24h',
    }
  );

  return token;
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
