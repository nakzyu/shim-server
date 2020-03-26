const express = require("express");
const { check } = require("express-validator");
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();
const postsControllers = require("../controllers/posts-controllers");

const router = express.Router();

router.get("/:pid", postsControllers.getPostById);

router.get("/user/:uid", postsControllers.getPostsByUserId);

router.post(
  "/",
  [check("description").isLength({ min: 5 })],
  multipartMiddleware,
  postsControllers.createPost
);

router.patch(
  "/:pid",
  [check("description").isLength({ min: 5 })],
  multipartMiddleware,
  postsControllers.updatePost
);

router.delete("/:pid", postsControllers.deletePost);

module.exports = router;
