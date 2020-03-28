const express = require("express");
const { check } = require("express-validator");
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();

const usersController = require("../controllers/users-controllers");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/:uid", usersController.getUsers);

router.post(
  "/signup",
  [
    (check("name")
      .not()
      .isEmpty(),
    check("email")
      .normalizeEmail()
      .isEmail(),
    check("password").isLength({ min: 6 }))
  ],
  usersController.signup
);

router.post("/login", usersController.login);

// above is fine for everyone

router.use(checkAuth);

// below is token required

router.patch(
  "/updateImage/:uid",
  multipartMiddleware,
  usersController.updateUserImage
);

router.patch(
  "/updateDescription/:uid",
  check("description").isLength({ max: 26 }),
  usersController.updateUserDescription
);

module.exports = router;
