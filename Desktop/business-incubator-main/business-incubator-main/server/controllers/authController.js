const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

function getPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function getResetTokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getResetPasswordUrl(req, token) {
  const origin = (process.env.CLIENT_ORIGIN || `${req.protocol}://${req.get('host')}`)
    .split(',')[0]
    .trim();
  return `${origin}/reset-password.html?token=${token}`;
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateDeviceToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function sendOtpEmail(email, otp, purpose) {
  const subject = purpose === 'verify'
    ? 'Verify your Business Incubator account'
    : 'Your login OTP - Business Incubator';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #1a1a2e; margin-bottom: 8px;">
        ${purpose === 'verify' ? 'Verify your email' : 'Login verification'}
      </h2>
      <p style="color: #4b5563; margin-bottom: 24px;">
        ${purpose === 'verify'
          ? 'Thanks for registering! Please enter this OTP to verify your email address.'
          : 'A login attempt was made from a new device. Enter this OTP to continue.'}
      </p>
      <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">${otp}</span>
      </div>
      <p style="color: #6b7280; font-size: 14px;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail({ to: email, subject, html });
}

// Register — sends OTP, does NOT return auth token yet
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const allowedSelfServeRoles = ['startup', 'mentor', 'investor'];
    const normalizedRole = allowedSelfServeRoles.includes(role) ? role : 'startup';

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = generateOtp();

    user = await User.create({
      name,
      email,
      password,
      role: normalizedRole,
      verified: false,
      emailOtp: otp,
      emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
      emailOtpPurpose: 'verify',
    });

    await sendOtpEmail(email, otp, 'verify');

    res.status(201).json({
      message: 'OTP sent to your email. Please verify to continue.',
      email,
      requiresOtp: true,
      purpose: 'verify',
    });
  } catch (error) {
    next(error);
  }
};

// Login — checks password, then either issues token (trusted device) or sends OTP
exports.login = async (req, res, next) => {
  try {
    const { email, password, deviceToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password +emailOtp +emailOtpExpires +emailOtpPurpose +trustedDevices');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.verified) {
      // Resend verification OTP
      const otp = generateOtp();
      user.emailOtp = otp;
      user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      user.emailOtpPurpose = 'verify';
      await user.save({ validateBeforeSave: false });
      await sendOtpEmail(email, otp, 'verify');

      return res.status(200).json({
        message: 'Please verify your email first. OTP resent.',
        email,
        requiresOtp: true,
        purpose: 'verify',
      });
    }

    // Check if device is trusted
    if (deviceToken && user.trustedDevices && user.trustedDevices.includes(deviceToken)) {
      const token = generateToken(user._id, user.role);
      return res.status(200).json({ token, user: getPublicUser(user) });
    }

    // New device — send login OTP
    const otp = generateOtp();
    user.emailOtp = otp;
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.emailOtpPurpose = 'login';
    await user.save({ validateBeforeSave: false });
    await sendOtpEmail(email, otp, 'login');

    return res.status(200).json({
      message: 'OTP sent to your email.',
      email,
      requiresOtp: true,
      purpose: 'login',
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP — for both registration and login
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, trustDevice } = req.body;

    const user = await User.findOne({ email }).select('+emailOtp +emailOtpExpires +emailOtpPurpose +trustedDevices');

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!user.emailOtp || !user.emailOtpExpires) {
      return res.status(400).json({ message: 'No OTP requested. Please try again.' });
    }

    if (new Date() > user.emailOtpExpires) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.emailOtp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // OTP is valid
    user.emailOtp = undefined;
    user.emailOtpExpires = undefined;
    user.emailOtpPurpose = undefined;

    let newDeviceToken = null;

    if (trustDevice) {
      newDeviceToken = generateDeviceToken();
      if (!user.trustedDevices) user.trustedDevices = [];
      // Keep max 5 trusted devices
      if (user.trustedDevices.length >= 5) {
        user.trustedDevices.shift();
      }
      user.trustedDevices.push(newDeviceToken);
    }

    if (!user.verified) {
      user.verified = true;
    }

    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: 'OTP verified successfully.',
      token,
      user: getPublicUser(user),
      deviceToken: newDeviceToken,
    });
  } catch (error) {
    next(error);
  }
};

// Resend OTP
exports.resendOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;

    const user = await User.findOne({ email }).select('+emailOtp +emailOtpExpires +emailOtpPurpose');
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const otp = generateOtp();
    user.emailOtp = otp;
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.emailOtpPurpose = purpose || 'verify';
    await user.save({ validateBeforeSave: false });

    await sendOtpEmail(email, otp, user.emailOtpPurpose);

    res.status(200).json({ message: 'OTP resent successfully.' });
  } catch (error) {
    next(error);
  }
};

// Request password reset
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    const response = {
      message: 'If an account exists for that email, a password reset link has been prepared.',
    };

    if (!user) {
      return res.status(200).json(response);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresInMinutes = Number(process.env.RESET_PASSWORD_EXPIRE_MINUTES) || 15;

    user.resetPasswordToken = getResetTokenHash(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const resetUrl = getResetPasswordUrl(req, resetToken);

    if (process.env.NODE_ENV !== 'production') {
      response.resetToken = resetToken;
      response.resetUrl = resetUrl;
      response.expiresInMinutes = expiresInMinutes;
      console.log(`Password reset link for ${user.email}: ${resetUrl}`);
    }

    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const resetPasswordToken = getResetTokenHash(token);

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+password +resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const authToken = generateToken(user._id, user.role);

    return res.status(200).json({
      message: 'Password reset successfully',
      token: authToken,
      user: getPublicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar } = req.body;
    const updates = {};

    if (typeof name === 'string') updates.name = name;
    if (typeof bio === 'string') updates.bio = bio;
    if (typeof avatar === 'string') updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select('name email role bio avatar verified');

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
