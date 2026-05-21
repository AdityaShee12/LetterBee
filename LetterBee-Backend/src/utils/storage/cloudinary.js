import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Cloudinary config (NOTE: env use kora better)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Magic number check (REAL file validation)
const isValidImage = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);

  const pngSignature = fileBuffer.slice(0, 4).toString("hex");   // 89504e47
  const jpegSignature = fileBuffer.slice(0, 3).toString("hex");  // ffd8ff

  return (
    pngSignature === "89504e47" ||
    jpegSignature === "ffd8ff"
  );
};

const safeUnlink = (path) => {
  try {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
  } catch (err) {
    console.error("File delete error:", err.message);
  }
};

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Magic number validation
    const valid = isValidImage(localFilePath);

    if (!valid) {
      safeUnlink(localFilePath);
      throw new Error("Invalid file type (magic number mismatch)");
    }

    // Upload (restrict only image)
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image", // only images allowed
    });

    // Delete temp file
    safeUnlink(localFilePath);

    return response;
  } catch (error) {

    // Ensure temp file delete
    safeUnlink(localFilePath);

    return null;
  }
};

export { uploadOnCloudinary };