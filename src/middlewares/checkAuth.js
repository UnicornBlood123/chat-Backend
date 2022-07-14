import verifyJWTToken from "../utils/verifyJWToken.js";

const checkAuth = (req, res, next) => {
  if (
    req.path === "/user/login" ||
    req.path === "/user/registration" ||
    req.path === "/user/registration/verify"
  ) {
    return next();
  }

  const token = req.headers.token;

  verifyJWTToken(token)
    .then((user) => {
      req.user = user.data._doc;
      next();
    })
    .catch(() => {
      res.status(403).json("Неверный токен");
    });
};

export default checkAuth;
