import User from "../models/user.js";
import { validationResult } from "express-validator";
import createJWToken from "../utils/createJWToken.js";
import bcrypt from "bcryptjs";
import sendActivationMail from "../utils/sendActivationMail.js";

class UserController {
  io;
  constructor(io) {
    this.io = io;
  }

  show = (req, res) => {
    const id = req.params.id;
    User.findById(id)
      .then((user) => res.json(user))
      .catch(() => res.status(404).json({ message: "Пользователь не найден" }));
  };

  findUsers = (req, res) => {
    const query = req.query.query;
    User.find()
      .or([
        { fullname: new RegExp(query, "i") },
        { email: new RegExp(query, "i") },
      ])
      .then((users) => res.json(users))
      .catch((err) => {
        return res.status(404).json({
          status: "error",
          message: err,
        });
      });
  };

  create = (req, res) => {
    const postData = {
      email: req.body.email,
      fullname: req.body.fullname,
      password: req.body.password,
    };

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    } else {
      const user = new User(postData);
      user
        .save()
        .then((obj) => {
          sendActivationMail(obj.email, obj.confirmed_hash)
            .then(() => res.json(obj))
            .catch((err) => {
              console.log(err);
            });
        })
        .catch(() =>
          res
            .status(500)
            .json({ status: "error", message: "Такая почта уже используется" })
        );
    }
  };

  verify = (req, res) => {
    const hash = req.query.hash;
    if (!hash) {
      res.status(422).json({ errors: "Неверная хэш-ссылка" });
    } else {
      User.findOne({ confirmed_hash: hash }, (err, user) => {
        if (err || !user) {
          return res.status(404).json({
            status: "error",
            message: "Хэш не найден",
          });
        }

        user.confirmed = true;

        user.save((err) => {
          if (err) {
            return res.status(404).json({
              status: "error",
              message: err,
            });
          }
          res.json({
            status: "success",
            message: "Аккаунт успешно подтвержден!",
          });
        });
      });
    }
  };

  login = (req, res) => {
    const postData = {
      email: req.body.email,
      password: req.body.password,
    };

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    User.findOne({ email: postData.email }, (err, user) => {
      if (err || !user) {
        console.log(user, err);
        return res.status(404).json({
          message: "Пользователь не найден",
        });
      }

      if (bcrypt.compareSync(postData.password, user.password)) {
        const token = createJWToken(user);
        res.json({
          status: "success",
          token,
        });
      } else {
        res.status(403).json({
          status: "error",
          message: "Некорректный логин или пароль",
        });
      }
    });
  };

  delete = (req, res) => {
    const id = req.params.id;
    User.findOneAndRemove({ _id: id })
      .then((user) =>
        res.json({ message: `Пользователь ${user.fullname} удалён` })
      )
      .catch(() => res.status(404).json({ message: "Пользователь не найден" }));
  };

  getMe = (req, res) => {
    const id = req.user._id;
    User.findById(id)
      .then((user) => res.json(user))
      .catch(() => res.status(404).json({ message: "Пользователь не найден" }));
  };
}

export default UserController;
