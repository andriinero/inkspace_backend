const mongoose = require('mongoose');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');

const storage = new GridFsStorage({
  db: mongoose.connection,
  file: (req, file) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      return {
        bucketName: 'images',
        filename: `${Date.now()}_${file.originalname}`,
      };
    }
  },
});

exports.upload = multer({ storage, limits: 1024 * 1024 * 2 });
