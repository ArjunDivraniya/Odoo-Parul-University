const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const authRepository = require('../repositories/auth.repository');
const { findById: findShopById } = require('../repositories/shop.repository');
const { slugify } = require('../utils/slugify');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function buildTokenPayload(user) {
  return {
    userId: user.id,
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

  const updatedUser = await authRepository.touchLastLogin(user.id);
  const token = signAccessToken(updatedUser);

  return {
    accessToken: token,
    token,
    user: toPublicUser(updatedUser),
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

module.exports = {
  registerAdmin,
  loginUser,
  getCurrentUser,
  getShopContext,
  toPublicUser,
};