const { validationResult } = require("express-validator");
const mongooose = require("mongoose");
const cloudinary = require("cloudinary");
const HttpError = require("../models/http-error");

const Post = require("../models/post");
const User = require("../models/user");

cloudinary.config({
  cloud_name: `${process.env.CLOUDINARY_NAME}`,
  api_key: `${process.env.CLOUDINARY_KEY}`,
  api_secret: `${process.env.CLOUDINARY_SECRET}`
});

const getAllPosts = async (req, res, next) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results = {};
  if (endIndex < (await Post.countDocuments().exec())) {
    results.next = {
      page: page + 1,
      limit: limit
    };
  }

  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit: limit
    };
  }

  try {
    results.results = await Post.find({})
      .sort("-date")
      .limit(limit)
      .skip(startIndex)
      .exec();
    res.paginatedResults = results;
  } catch (err) {
    const error = new HttpError("There is no place.", 404);
    return next(error);
  }

  res.json(res.paginatedResults);
};

const getPostById = async (req, res, next) => {
  const postId = req.params.pid;

  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a post.",
      500
    );
    return next(error);
  }

  if (!post) {
    const error = new HttpError(
      "Could not find a post for the provided post id.",
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
      "Fetching posts failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({
    posts: userWithPosts.posts
      .map(post => post.toObject({ getters: true }))
      .reverse()
  });
};

const createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const { description, date } = req.body;

  let createdPost;
  try {
    await cloudinary.uploader.upload(req.files.image.path, result => {
      createdPost = new Post({
        creator: req.userData.userId,
        description,
        date,
        image: result.url
      });
    });
  } catch (err) {
    const error = new HttpError(
      "Creating post failed, please try again later",
      500
    );
    return next(error);
  }

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "Could not find user for provided user Id.",
      404
    );
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
    const error = new HttpError("Creating post failed.", 500);
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
    const error = new HttpError(
      "Something went wrong, could not find a post.",
      500
    );
    return next(error);
  }

  if (post.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this place.", 401);
    return next(error);
  }

  post.description = description;

  try {
    await post.save();
  } catch (err) {
    const error = new HttpError("Something went wrong, could not update", 500);
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
    const error = new HttpError("Something went wrong.", 500);
    return next(error);
  }

  if (!post) {
    const error = new HttpError(
      "Could not find post for provided post Id.",
      404
    );
    return next(error);
  }

  if (post.creator.id !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to delete this place.",
      401
    );
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
    const error = new HttpError("Somthing went wrong.", 500);
    return next(error);
  }

  res.status(200).json({ message: "Deleted post." });
};

const likePost = async (req, res, next) => {
  const postId = req.params.pid;

  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    const error = new HttpError("Something went wrong.", 500);
    return next(error);
  }

  post.likedBy.push(req.userData.userId);

  console.log(post.likedBy);

  try {
    await post.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update the post.",
      500
    );
    return next(error);
  }

  res.status(201).json({ post });
};

const unLikePost = async (req, res, next) => {
  const postId = req.params.pid;

  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    const error = new HttpError("Something went wrong.", 500);
    return next(error);
  }

  post.likedBy.pull(req.userData.userId);

  console.log(post.likedBy);

  try {
    await post.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not  update.",
      500
    );
    return next(error);
  }

  res.status(201).json({ post });
};

exports.getAllPosts = getAllPosts;
exports.getPostById = getPostById;
exports.getPostsByUserId = getPostsByUserId;
exports.createPost = createPost;
exports.updatePost = updatePost;
exports.deletePost = deletePost;
exports.likePost = likePost;
exports.unLikePost = unLikePost;
