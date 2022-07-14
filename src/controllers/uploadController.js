import UploadedFile from "../models/uploadedFile.js";
import cloudinary from "../core/cloudinary.js";

class UploadController {
  create = (req, res) => {
    const userId = req.user._id;
    const file = req.file;

    cloudinary.v2.uploader
      .upload_stream({ resource_type: "auto" }, (error, result) => {
        if (error || !result) {
          return res.status(500).json({
            status: "error",
            message: error || "upload error",
          });
        }

        const fileData = {
          filename: result.original_filename,
          size: result.bytes,
          ext: result.format,
          url: result.url,
          user: userId,
        };

        const uploadFile = new UploadedFile(fileData);

        uploadFile
          .save()
          .then((fileObj) => {
            res.json({
              status: "success",
              file: fileObj,
            });
          })
          .catch((err) => {
            res.json({
              status: "error",
              message: err,
            });
          });
      })
      .end(file.buffer);
  };

  delete = (req, res) => {
    const fileId = req.user._id;
    UploadedFile.deleteOne({ _id: fileId }, function (err) {
      if (err) {
        return res.status(500).json({
          status: "error",
          message: err,
        });
      }
      res.json({
        status: "success",
      });
    });
  };
}

export default UploadController;
