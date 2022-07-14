import mongoose from "mongoose";
const Schema = mongoose.Schema;

const uploadedFileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // message: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Message",
    //   required: true,
    // },
    filename: {
      type: String,
    },
    url: {
      type: String,
    },
    size: {
      type: Number,
    },
    ext: {
      type: String,
    },
  },
  { timestamps: true }
);

const UploadedFile = mongoose.model("UploadedFile", uploadedFileSchema);

export default UploadedFile;
