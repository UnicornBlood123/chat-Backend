import Dialog from "../models/dialog.js";
import Message from "../models/message.js";

class DialogController {
  io;
  constructor(io) {
    this.io = io;
  }

  newMessageForDialog = (req, res, dialog, authorId) => {
    dialog
      .save()
      .then((dialogObj) => {
        const message = new Message({
          text: req.body.text,
          dialog: dialogObj._id,
          user: authorId,
        });
        message
          .save()
          .then(() => {
            dialogObj.lastMessage = message;
            dialogObj.save().then(() => {
              this.io.emit("SERVER:NEW_DIALOG", dialogObj);
              res.json(dialogObj);
            });
          })
          .catch((reason) => {
            res.json(reason);
          });
      })
      .catch((reason) => res.json(reason));
  };

  show = (req, res) => {
    const userId = req.user._id;
    Dialog.find()
      .or([
        { author: userId, authorDeletedDialog: false },
        { partner: userId, partnerDeletedDialog: false },
      ])
      .populate(["author", "partner"])
      .populate({
        path: "lastMessage",
        populate: {
          path: "user",
        },
      })
      .populate({
        path: "lastMessage",
        populate: {
          path: "attachments",
        },
      })
      .exec((err, dialog) => {
        if (err) {
          return res.status(404).json({ message: "Диалог не найден" });
        }
        return res.json(dialog);
      });
  };

  create = (req, res) => {
    const authorId = req.user._id;
    const postData = {
      author: authorId,
      partner: req.body.partner,
    };

    Dialog.findOne(
      {
        $or: [
          {
            author: authorId,
            partner: req.body.partner,
          },
          {
            author: req.body.partner,
            partner: authorId,
          },
        ],
      },
      (err, dialog) => {
        if (err) {
          return res.status(500).json({
            status: "error",
            message: err,
          });
        }
        if (
          dialog &&
          ((authorId === dialog.partner._id.toString() &&
            !dialog.partnerDeletedDialog) ||
            (authorId === dialog.author._id.toString() &&
              !dialog.authorDeletedDialog))
        ) {
          return res.status(403).json({
            status: "error",
            message: "Такой диалог уже есть",
          });
        } else if (
          dialog &&
          authorId === dialog.partner._id.toString() &&
          dialog.partnerDeletedDialog
        ) {
          dialog.partnerDeletedDialog = false;
          this.newMessageForDialog(req, res, dialog, authorId);
        } else if (
          dialog &&
          authorId === dialog.author._id.toString() &&
          dialog.authorDeletedDialog
        ) {
          dialog.authorDeletedDialog = false;
          this.newMessageForDialog(req, res, dialog, authorId);
        } else {
          const dialog = new Dialog(postData);
          this.newMessageForDialog(req, res, dialog, authorId);
        }
      }
    );
  };

  delete = (req, res) => {
    const authorId = req.user._id;
    const id = req.params.id;
    Dialog.findOne({ _id: id }, (err, dialog) => {
      if (err) {
        return res.status(500).json({
          status: "error",
          message: err,
        });
      }
      if (dialog) {
        if (authorId === dialog.author._id.toString()) {
          dialog.authorDeletedDialog = true;
          Message.find({ dialog: id })
            .populate(["user"])
            .exec((err, messages) => {
              if (err) {
                return res
                  .status(404)
                  .json({ message: "Сообщение не найдено" });
              }
              messages.forEach((message) => {
                message.authorDeletedMessage = true;
                message.save();
              });
            });
        }
        if (authorId === dialog.partner._id.toString()) {
          dialog.partnerDeletedDialog = true;
          Message.find({ dialog: id })
            .populate(["user"])
            .exec((err, messages) => {
              if (err) {
                return res
                  .status(404)
                  .json({ message: "Сообщение не найдено" });
              }
              messages.forEach((message) => {
                message.partnerDeletedMessage = true;
                message.save();
              });
            });
        }
        if (dialog.partnerDeletedDialog && dialog.authorDeletedDialog) {
          Message.find({ dialog: id }).exec((err, messages) => {
            if (err) {
              return res
                .status(404)
                .json({ message: "Сообщения в диалоге не найдены" });
            }
            messages.forEach((message) => {
              message.remove();
            });
          });
          dialog
            .remove()
            .then(() => {
              return res.status(200).json({
                status: "success",
                message: "Диалог полностью удалён",
              });
            })
            .catch((reason) => res.json(reason));
        }
        dialog
          .save()
          .then(() => {
            return res.status(200).json({
              status: "success",
              message: "Диалог удалён",
            });
          })
          .catch((reason) => res.json(reason));
      } else {
        return res.status(404).json({
          status: "error",
          message: "Диалог не найден",
        });
      }
    });
  };
}

export default DialogController;
