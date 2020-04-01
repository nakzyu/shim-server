const express = require("express");
const { check } = require("express-validator");
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();
const postsControllers = require("../controllers/posts-controllers");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/", postsControllers.getAllPosts);

router.get("/:pid", postsControllers.getPostById);

router.get("/user/:uid", postsControllers.getPostsByUserId);

// above is fine for everyone

router.use(checkAuth);

// below is token required

router.post(
  "/",
  multipartMiddleware,
  check("description").isLength({ max: 300 }),
  postsControllers.createPost
);

router.patch(
  "/:pid",
  [check("description").isLength({ max: 100 })],
  postsControllers.updatePost
);

router.delete("/:pid", postsControllers.deletePost);

router.post("/like/:pid", postsControllers.likePost);

router.delete("/unLike/:pid", postsControllers.unLikePost);

module.exports = router;
