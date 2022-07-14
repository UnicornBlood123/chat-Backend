import { body } from "express-validator";

const checkRegistration = [
  body("email").isEmail(),
  body("fullname").isLength({ min: 1 }),
  body("password").isLength({ min: 3 }),
];

export default checkRegistration;
