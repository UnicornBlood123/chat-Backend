import mongoose from "mongoose";
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    text: {
      type: String,
    },
    dialog: {
      type: Schema.Types.ObjectId,
      ref: "Dialog",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorDeletedMessage: {
      type: Boolean,
      default: false,
    },
    partnerDeletedMessage: {
      type: Boolean,
      default: false,
    },
    unread: {
      type: Boolean,
      default: true,
    },
    attachments: [{ type: Schema.Types.ObjectId, ref: "UploadedFile" }],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
