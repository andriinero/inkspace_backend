const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema(
  {},
  { collection: 'images.files', strict: false, id: false }
);

module.exports = mongoose.model('Image', ImageSchema);
