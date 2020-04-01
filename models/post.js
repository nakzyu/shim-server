const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const postSchema = new Schema({
  description: { type: String, required: true },
  image: { type: String, required: true },
  date: { type: String, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  likedBy: [{ type: String, default: null, required: true }]
});

module.exports = mongoose.model("Post", postSchema);
