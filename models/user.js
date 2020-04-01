const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  posts: [{ type: mongoose.Types.ObjectId, required: true, ref: "Post" }],
  image: {
    type: String,
    default:
      "https://res.cloudinary.com/daokgy02f/image/upload/v1585382379/iconmonstr-user-20-64_zyhzxj.png",
    required: true
  },
  description: { type: String, default: "No Message", required: true }
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
