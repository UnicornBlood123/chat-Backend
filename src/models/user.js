import mongoose from "mongoose";
const Schema = mongoose.Schema;
import isEmail from "validator/lib/isEmail.js";
import PasswordHash from "../utils/generatePasswordHash.js";
import differenceInMinutes from "date-fns/differenceInMinutes/index.js";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      validate: [isEmail, "Invalid email"],
      index: { unique: true },
    },
    fullname: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    confirmed_hash: { type: String },
    last_seen: {
      type: Date,
      default: new Date(),
    },
    avatar: String,
  },
  { timestamps: true }
);

userSchema.virtual("isOnline").get(function () {
  return differenceInMinutes(new Date(), this.last_seen) < 5;
});

userSchema.set("toJSON", {
  virtuals: true,
});

userSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  PasswordHash(user.password)
    .then((hashPassword) => {
      user.password = hashPassword;
      PasswordHash(String(new Date())).then((hash) => {
        user.confirmed_hash = hash;
        next();
      });
    })
    .catch(() => next());
});

const User = mongoose.model("User", userSchema);

export default User;
