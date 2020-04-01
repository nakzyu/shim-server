const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary");

const HttpError = require("../models/http-error");
const User = require("../models/user");

cloudinary.config({
  cloud_name: `${process.env.CLOUDINARY_NAME}`,
  api_key: `${process.env.CLOUDINARY_KEY}`,
  api_secret: `${process.env.CLOUDINARY_SECRET}`
});

const getUsers = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      "Fetching user failed, please try again later.",
      500
    );
    return next(error);
  }

  const { image, name, description, posts } = user;

  res.json({
    image,
    name,
    description,
    posts
  });
};

const signup = async (req, res, next) => {
  console.log(req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead.",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again.",
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    posts: []
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Signing up failed.", 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      `${process.env.JWT_KEY}`,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Need login to Like!", 422);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again.",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      `${process.env.JWT_KEY}`,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token
  });
};

const updateUserImage = async (req, res, next) => {
  const userId = req.params.uid;

  let user;

  if (!req.files.image) {
    const error = new HttpError("Please add an image.", 500);
    return next(error);
  }

  //check user exist or not
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("didn't find the user", 500);
    return next(error);
  }

  let imageToUpdatedUrl;
  try {
    await cloudinary.uploader.upload(req.files.image.path, result => {
      imageToUpdatedUrl = result.url;
    });
  } catch (err) {
    const error = new HttpError(
      "Could not update the image, please try again later.",
      500
    );
    return next(error);
  }

  user.image = imageToUpdatedUrl;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError("Could not update.", 500);
    return next(error);
  }

  res.status(200).json({ user });
};

const updateUserDescription = async (req, res, next) => {
  const errors = validationResult(req);
  console.log(req.body);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { description } = req.body;
  const userId = req.params.uid;
  console.log(userId);

  let user;

  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("somethingwent wrong", 500);
    return next(error);
  }

  console.log(user);
  user.description = description;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError("Could not update.", 500);
    return next(error);
  }

  res.status(200).json({ user });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
exports.updateUserImage = updateUserImage;
exports.updateUserDescription = updateUserDescription;
