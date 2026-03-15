const multer = require("multer");
const path = require("path");
const fs = require("fs");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// Optional file filter
const fileFilter = (req, file, cb) => {
  const allowed = /jpg|jpeg|png|pdf/;

  const ext = allowed.test(path.extname(file.originalname).toLowerCase());

  if (ext) {
    return cb(null, true);
  }

  cb(new Error("Only images and pdf allowed"));
};

const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;