import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// 🔐 MIME TYPE CHECK
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only PNG/JPEG allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
});