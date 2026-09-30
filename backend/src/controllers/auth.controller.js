const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/responseFormatter');

class AuthController {
  async config(req, res, next) {
    try { return res.status(200).json(sendSuccess(await authService.getPublicAuthConfig(), 'Authentication config retrieved')); }
    catch (error) { next(error); }
  }

  async google(req, res, next) {
    try {
      if (!req.body.credential) { const error = new Error('Google credential is required'); error.statusCode = 400; throw error; }
      return res.status(200).json(sendSuccess(await authService.googleLogin(req.body.credential), 'Google sign-in successful'));
    } catch (error) { next(error); }
  }

  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const result = await authService.registerUser({ name, email, password });
      return res.status(201).json(
        sendSuccess(result, 'User registered successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.loginUser(email, password);
      return res.status(200).json(
        sendSuccess(result, 'Login successful')
      );
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const profile = await authService.getUserProfile(req.user._id);
      return res.status(200).json(
        sendSuccess(profile, 'Profile retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const updatedProfile = await authService.updateUserProfile(req.user._id, req.body);
      return res.status(200).json(
        sendSuccess(updatedProfile, 'Profile updated successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      // Stateless JWT logout is handled on client side, but we return a success response
      return res.status(200).json(
        sendSuccess(null, 'Logout successful. Please delete your token.')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
