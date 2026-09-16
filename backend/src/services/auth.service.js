const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/auth.validator');
const authRepository = require('../repositories/auth.repository');
const { findById: findShopById } = require('../repositories/shop.repository');
const { slugify } = require('../utils/slugify');
const { sendPasswordResetEmail } = require('./mailer.service');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const RESET_TOKEN_TTL = '1h';
const FRONTEND_URL = (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function buildTokenPayload(user) {
  return {
    userId: user.id,
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    shopId: user.shopId,
  };
}

function signAccessToken(user) {
  return jwt.sign(buildTokenPayload(user), JWT_SECRET, { expiresIn: '1d' });
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    shopId: user.shopId,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    shop: user.shop
      ? {
        id: user.shop.id,
        name: user.shop.name,
        slug: user.shop.slug,
      }
      : null,
  };
}

async function registerAdmin(payload) {
  const data = registerSchema.parse(payload);

  const existingUser = await authRepository.findUserByEmail(data.email);
  if (existingUser) {
    throw createError(400, 'Email is already registered');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const slugBase = slugify(data.shopName);
  const shopSlug = `${slugBase}-${crypto.randomBytes(3).toString('hex')}`;

  const { user, shop } = await authRepository.createAdminWithShop({
    userData: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
    shopData: {
      name: data.shopName,
      slug: shopSlug,
    },
  });

  const token = signAccessToken(user);
  const refreshedUser = {
    ...user,
    shop,
  };

  return {
    accessToken: token,
    token,
    user: toPublicUser(refreshedUser),
  };
}

async function loginUser(payload) {
  const data = loginSchema.parse(payload);

  const user = await authRepository.findUserByEmail(data.email);
  if (!user || !user.isActive) {
    throw createError(400, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) {
    throw createError(400, 'Invalid credentials');
  }

  let authenticatedUser = user;

  try {
    authenticatedUser = await authRepository.touchLastLogin(user.id);
  } catch (error) {
    console.warn('⚠️ Failed to update lastLogin during auth, continuing login:', error.message);
  }

  const token = signAccessToken(authenticatedUser);

  return {
    accessToken: token,
    token,
    user: toPublicUser(authenticatedUser),
  };
}

async function getCurrentUser(userId) {
  const user = await authRepository.findUserById(userId);
  if (!user || !user.isActive) {
    throw createError(404, 'User not found');
  }

  return toPublicUser(user);
}

async function getShopContext(shopId) {
  if (!shopId) {
    return null;
  }

  return findShopById(shopId);
}

function buildResetLink(token) {
  return `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
}

async function requestPasswordReset(payload) {
  const data = forgotPasswordSchema.parse(payload);
  const user = await authRepository.findUserByEmail(data.email);

  if (!user || !user.isActive) {
    return {
      message: 'If the email exists, a password reset link has been sent.',
    };
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      purpose: 'password-reset',
    },
    JWT_SECRET,
    { expiresIn: RESET_TOKEN_TTL }
  );

  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetLink: buildResetLink(token),
    shopName: user.shop?.name || 'The Coffe Concept',
  });

  return {
    message: 'If the email exists, a password reset link has been sent.',
  };
}

async function resetPassword(payload) {
  const data = resetPasswordSchema.parse(payload);

  let decoded;
  try {
    decoded = jwt.verify(data.token, JWT_SECRET);
  } catch (error) {
    throw createError(400, 'Reset link is invalid or expired');
  }

  if (decoded.purpose !== 'password-reset' || !decoded.userId || !decoded.email) {
    throw createError(400, 'Reset link is invalid or expired');
  }

  const user = await authRepository.findUserById(decoded.userId);
  if (!user || !user.isActive || user.email !== decoded.email) {
    throw createError(400, 'Reset link is invalid or expired');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  await authRepository.updatePassword(user.id, hashedPassword);

  return {
    message: 'Password updated successfully. Please sign in with your new password.',
  };
}

module.exports = {
  registerAdmin,
  loginUser,
  getCurrentUser,
  getShopContext,
  requestPasswordReset,
  resetPassword,
  toPublicUser,
};