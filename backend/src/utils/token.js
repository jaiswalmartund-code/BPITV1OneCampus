import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'supersecretjwtkeybpitv1', {
    expiresIn: '30d',
  });
};

export default generateToken;
