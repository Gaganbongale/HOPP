const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const User = require('../models/User');

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

  async googleLogin(credential) {
    if (!process.env.GOOGLE_CLIENT_ID) {
      const error = new Error('Google sign-in is not configured. Add GOOGLE_CLIENT_ID to backend/.env.');
      error.statusCode = 503;
      throw error;
    }
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!response.ok) {
      const error = new Error('Google sign-in could not verify this account. Please try again.');
      error.statusCode = 401;
      throw error;
    }
    const claims = await response.json();
    if (claims.aud !== process.env.GOOGLE_CLIENT_ID || claims.email_verified !== 'true' || !claims.sub || !claims.email) {
      const error = new Error('Google account verification failed.');
      error.statusCode = 401;
      throw error;
    }
    let user = await User.findOne({ googleId: claims.sub });
    if (!user) {
      user = await User.findOne({ email: claims.email.toLowerCase() });
      if (user) user.googleId = claims.sub;
      else user = new User({ name: claims.name || claims.email.split('@')[0], email: claims.email, googleId: claims.sub, authProvider: 'google', profileImage: claims.picture || '' });
    }
    user.authProvider = 'google';
    user.lastLogin = new Date();
    if (claims.name) user.name = claims.name;
    if (claims.picture) user.profileImage = claims.picture;
    await user.save();
    const token = this.generateToken(user._id);
    const userObj = user.toObject();
    delete userObj.password;
    return { token, user: userObj };
  }

  async getPublicAuthConfig() { return { googleClientId: process.env.GOOGLE_CLIENT_ID || null }; }

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
