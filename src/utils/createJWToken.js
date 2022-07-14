import reduce from "lodash";

import jwt from "jsonwebtoken";

const createJWToken = (user) => {
  return jwt.sign(
    {
      data: reduce(
        user,
        (result, curVal, key) => {
          if (key !== "password") {
            result[key] = curVal;
          }
          return result;
        },
        {}
      ),
    },
    String(process.env.JWT_SECRET),
    {
      expiresIn: process.env.JVT_MAX_AGE,
      algorithm: "HS256",
    }
  );
};

export default createJWToken;
