import { body } from "express-validator";

const checkPassword = [
  body("email").isEmail(),
  body("fullname").isLength({ min: 3 }),
  body("password").isLength({ min: 3 }),
];

export default checkPassword;
