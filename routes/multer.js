const multer = require('multer');
const { storage } = require('../cloudConfig'); // Cloudinary storage
const upload = multer({ storage });

module.exports = upload;
