const { validationResult } = require("express-validator");
const mongooose = require("mongoose");
const cloudinary = require("cloudinary");
const HttpError = require("../models/http-error");

const Post = require("../models/post");
const User = require("../models/user");

const createPost = async (req, res, next) => {
  const { description, date } = req.body;

  let createdPost;

  await cloudinary.uploader.upload(req.files.image.path, result => {
    createdPost = new Post({
      creator: req.userData.userId,
      description,
      date,
      image: result.url
    });
  });

  console.log(createdPost);

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("creating posts failed", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);
    return next(error);
  }

  console.log(user);

  try {
    const sess = await mongooose.startSession();
    sess.startTransaction();
    await createdPost.save({ session: sess });
    user.posts.push(createdPost);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("creating post failed", 500);
    return next(error);
  }

  res.status(201).json({ post: createdPost });
};

const updatePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { description } = req.body;
  const postId = req.params.pid;

  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    const error = new HttpError("somethingwent wrong", 500);
    return next(error);
  }

  if (post.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this plae", 401);
    return next(error);
  }

  post.description = description;

  try {
    await post.save();
  } catch (err) {
    const error = new HttpError("S W R Couldnt update", 500);
    return next(error);
  }

  res.status(200).json({ post: post.toObject({ getters: true }) });
};

const updateUserImage = async () => {
  const userId = req.params.uid;

  let user;

  //check user exist or not
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError("didn't find the user", 500);
    return next(error);
  }

  let imageToUpdatedUrl;

  await cloudinary.uploader.upload(req.files.image.path, result => {
    imageToUpdatedUrl = result.url;
  });

  user.image = imageToUpdatedUrl;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError("Can't Update", 500);
    return next(error);
  }

  res.status(200).json({ user: user.toObject({ getters: true }) });
};

updateUserDescription;
