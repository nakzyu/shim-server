const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const postSchema = new Schema({
  description: { type: String, required: true },
  image: { type: String, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" }
});

module.exports = mongoose.model("Post", postSchema);
