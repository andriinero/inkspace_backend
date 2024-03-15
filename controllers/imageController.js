const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');

require('dotenv').config();

const mongoURI = process.env.DEV_MONGODB_URI;

const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      return {
        bucketName: 'photos',
        filename: `${Date.now()}_${file.originalname}`,
      };
    } else {
      return `${Date.now()}_${file.originalname}`;
    }
  },
});
const upload = multer({ storage });

exports.images_get = asyncHandler(async (req, res, next) => {});

exports.image_post = [
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const file = req.file;

    res.json({ id: file.id, contentType: file.contentType });
  }),
];
