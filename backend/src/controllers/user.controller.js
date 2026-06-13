const { ZodError } = require('zod');
const userService = require('../services/user.service');

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

exports.getUsers = async (req, res) => {
  try {
    const users = await userService.listUsers(req.user);
    res.json(users);
  } catch (error) {
    sendError(res, error);
  }
};

exports.createUser = async (req, res) => {
  try {
    const result = await userService.createUser(req.user, req.body);
    res.status(201).json(result);
  } catch (error) {
    sendError(res, error);
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user, req.params.id);
    res.json(user);
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.user, req.params.id, req.body);
    res.json(user);
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.user, req.params.id);
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
};
