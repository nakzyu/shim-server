const { validationResult } = require("express-validator");
const mongooose = require("mongoose");
const cloudinary = require("cloudinary");
const HttpError = require("../models/http-error");

const Post = require("../models/post");
const User = require("../models/user");

cloudinary.config({
  cloud_name: "daokgy02f",
  api_key: "458714275563999",
  api_secret: "jdbtRqdsVTYR1DB2EeTmZzQYYWQ"
});

const getAllPosts = async (req, res, next) => {
  let post;
  try {
    post = await Post.find();
  } catch (err) {
    const error = new HttpError("There is no place.", 404);
    return next(error);
  }

  res.json({ post }); // => { post } => { post: post }
};

const getPostById = async (req, res, next) => {
  const postId = req.params.pid;

  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    const error = new HttpError(
      "something went wrong, could not find a post.",
      500
    );
    return next(error);
  }

  if (!post) {
    const error = new HttpError(
      "Could not find a post for the provided id.",
      404
    );
    return next(error);
  }
  res.json({ posts: post.toObject({ getters: true }) }); // => { post } => { post: post }
};

const getPostsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  // let posts;
  let userWithPosts;
  try {
    userWithPosts = await User.findById(userId).populate("posts");
  } catch (err) {
    const error = new HttpError(
      "Fetching posts failed, please try again later",
      500
    );
    return next(error);
  }

  if (!userWithPosts || userWithPosts.posts.length === 0) {
    return next(
      new HttpError("Could not find posts for the provided user id.", 404)
    );
  }

  res.json({
    posts: userWithPosts.posts.map(post => post.toObject({ getters: true }))
  });
};

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

const deletePost = async (req, res, next) => {
  const postId = req.params.pid;

  let post;
  try {
    post = await Post.findById(postId).populate("creator");
  } catch (err) {
    const error = new HttpError("Somthing went wrong", 500);
    return next(error);
  }

  if (!post) {
    const error = new HttpError("could not find post for this id", 404);
    return next(error);
  }

  if (post.creator.id !== req.userData.userId) {
    const error = new HttpError("You are not allowed to delete this plae", 401);
    return next(error);
  }

  try {
    const sess = await mongooose.startSession();
    sess.startTransaction();
    await post.remove({ session: sess });
    post.creator.posts.pull(post);
    await post.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Somthing went wrong", 500);
    return next(error);
  }

  res.status(200).json({ message: "Deleted post." });
};

const likePost = async (req, res, next) => {
  const { userId } = req.body;
  const postId = req.params.pid;

  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    const error = new HttpError("somethingwent wrong", 500);
    return next(error);
  }
  console.log(post);
  console.log(userId);
  console.log(post.likes);

  post.likes.push(userId);

  console.log(post.likes);

  try {
    await post.save();
  } catch (err) {
    const error = new HttpError("S W R Couldnt update", 500);
    return next(error);
  }

  res.status(201).json({ userId });
};

const unLikePost = async (req, res, next) => {
  const { userId } = req.body;
  const postId = req.params.pid;

  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    const error = new HttpError("somethingwent wrong", 500);
    return next(error);
  }
  console.log(post);
  console.log(userId);
  console.log(post.likes);

  post.likes.pull(userId);

  console.log(post.likes);

  try {
    await post.save();
  } catch (err) {
    const error = new HttpError("S W R Couldnt update", 500);
    return next(error);
  }

  res.status(201).json({ userId });
};

exports.getAllPosts = getAllPosts;
exports.getPostById = getPostById;
exports.getPostsByUserId = getPostsByUserId;
exports.createPost = createPost;
exports.updatePost = updatePost;
exports.deletePost = deletePost;
exports.likePost = likePost;
exports.unLikePost = unLikePost;
