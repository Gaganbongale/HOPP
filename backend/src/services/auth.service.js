const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');

class AuthService {
  async registerUser({ name, email, password }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      const error = new Error('Email is already registered');
      error.statusCode = 409;
      throw error;
    }

    const user = await userRepository.create({
      name,
      email,
      password,
      role: 'user', // Default role
    });

    const token = this.generateToken(user._id);

    // Hide password before returning
    const userObj = user.toObject();
    delete userObj.password;

    return { token, user: userObj };
  }

  async loginUser(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = this.generateToken(user._id);

    const userObj = user.toObject();
    delete userObj.password;

    return { token, user: userObj };
  }

  async getUserProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  async updateUserProfile(userId, updateData) {
    // Only allow name and profileImage updates through profile endpoint
    const allowedUpdates = {};
    if (updateData.name) allowedUpdates.name = updateData.name;
    if (updateData.profileImage) allowedUpdates.profileImage = updateData.profileImage;

    const user = await userRepository.updateById(userId, allowedUpdates);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });
  }
}

module.exports = new AuthService();
