import { body } from "express-validator";

const checkLogin = [
  body("email").isEmail(),
  body("password").isLength({ min: 3 }),
];

export default checkLogin;
