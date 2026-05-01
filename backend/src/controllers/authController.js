const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { sendMail } = require('../utils/mailer');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenHelper');
const env = require('../config/env');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiResponse.badRequest(res, 'An account with this email already exists.');
    }

    const verificationToken = uuidv4();

    const requireVerification = env.get('REQUIRE_EMAIL_VERIFICATION');

    const user = await User.create({
      name,
      email,
      password,
      role,
      verificationToken: requireVerification ? verificationToken : undefined,
      verified: !requireVerification,
    });

    if (requireVerification) {
      const clientUrl = env.get('CLIENT_URL');
      const verifyUrl = `${clientUrl}/verify-email?token=${verificationToken}`;

      const html = `
        <h2>Welcome to Scrowsafe!</h2>
        <p>Thanks for creating an account. Please verify your email to get started.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#6c63ff;color:#fff;text-decoration:none;border-radius:6px;">
          Verify Email
        </a>
        <p style="margin-top:16px;color:#666;">If you didn't create this account, you can safely ignore this email.</p>
      `;

      await sendMail(email, 'Scrowsafe - Verify Your Email', html);

      ApiResponse.created(res, { requiresVerification: true }, 'Registration successful. Please check your email to verify your account.');
      return;
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    ApiResponse.created(res, {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    }, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return ApiResponse.unauthorized(res, 'Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return ApiResponse.unauthorized(res, 'Invalid email or password.');
    }

    if (!user.verified && env.get('REQUIRE_EMAIL_VERIFICATION')) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    ApiResponse.success(res, {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return ApiResponse.badRequest(res, 'Refresh token is required.');
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return ApiResponse.unauthorized(res, 'Invalid refresh token.');
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    ApiResponse.success(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }, 'Token refreshed');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Refresh token expired. Please log in again.');
    }
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+refreshToken');
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res) => {
  ApiResponse.success(res, { user: req.user });
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token }).select('+verificationToken');
    if (!user) {
      return ApiResponse.badRequest(res, 'Invalid or expired verification token.');
    }

    user.verified = true;
    user.verificationToken = undefined;
    await user.save();

    ApiResponse.success(res, null, 'Email verified successfully. You can now log in.');
  } catch (error) {
    next(error);
  }
};

exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select('+verificationToken');

    if (!user || user.verified) {
      return ApiResponse.success(res, null, 'If that email exists and is unverified, a new link has been sent.');
    }

    const newToken = uuidv4();
    user.verificationToken = newToken;
    await user.save();

    const clientUrl = env.get('CLIENT_URL');
    const verifyUrl = `${clientUrl}/verify-email?token=${newToken}`;

    const html = `
      <h2>Verify Your Email</h2>
      <p>Click the link below to verify your Scrowsafe account.</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#6c63ff;color:#fff;text-decoration:none;border-radius:6px;">
        Verify Email
      </a>
    `;

    await sendMail(email, 'Scrowsafe - Verify Your Email', html);

    ApiResponse.success(res, null, 'If that email exists and is unverified, a new link has been sent.');
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) {
        return ApiResponse.badRequest(res, 'This email is already taken.');
      }
      user.email = email;
    }

    if (name) user.name = name;
    await user.save();

    ApiResponse.success(res, { user: user.toJSON() }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return ApiResponse.badRequest(res, 'Current password is incorrect.');
    }

    user.password = newPassword;
    await user.save();

    ApiResponse.success(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return ApiResponse.success(res, null, 'If that email exists, a reset link has been sent.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const clientUrl = env.get('CLIENT_URL');
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

    const html = `
      <h2>Password Reset</h2>
      <p>You requested a password reset for your Scrowsafe account.</p>
      <p>Click the link below to reset your password. This link is valid for 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6c63ff;color:#fff;text-decoration:none;border-radius:6px;">
        Reset Password
      </a>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `;

    await sendMail(user.email, 'Scrowsafe - Password Reset', html);

    ApiResponse.success(res, null, 'If that email exists, a reset link has been sent.');
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return ApiResponse.badRequest(res, 'Invalid or expired reset token.');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    ApiResponse.success(res, null, 'Password has been reset successfully. You can now log in.');
  } catch (error) {
    next(error);
  }
};
