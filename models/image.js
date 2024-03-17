const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema(
  {
    __v: { type: Number, select: false },
  },
  { collection: 'images.files', strict: false, id: false }
);

module.exports = mongoose.model('Image', ImageSchema);
