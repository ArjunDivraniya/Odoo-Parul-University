const { ZodError } = require('zod');
const authService = require('../services/auth.service');

function sendError(res, error) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: error.issues?.map((issue) => ({
        path: issue.path,
        message: issue.message,
      })) || error.errors,
    });
  }

  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    error: error.message || 'Something went wrong',
  });
}

exports.register = async (req, res) => {
  try {
    const result = await authService.registerAdmin(req.body);
    res.status(201).json(result);
  } catch (error) {
    sendError(res, error);
  }
};

exports.signup = exports.register;

exports.login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
};

exports.me = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await authService.getCurrentUser(userId);
    res.json({ user });
  } catch (error) {
    sendError(res, error);
  }
};
