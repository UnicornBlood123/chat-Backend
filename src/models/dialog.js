import mongoose from "mongoose";
const Schema = mongoose.Schema;

const dialogSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    partner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorDeletedDialog: {
      type: Boolean,
      default: false,
    },
    partnerDeletedDialog: {
      type: Boolean,
      default: false,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

const Dialog = mongoose.model("Dialog", dialogSchema);

export default Dialog;
