import Message from "../models/message.js";
import Dialog from "../models/dialog.js";

class MessageController {
  io;
  constructor(io) {
    this.io = io;
  }

  updateReadStatus = (res, userId, dialogId) => {
    Message.updateMany(
      { dialog: dialogId, user: { $ne: userId } },
      { $set: { unread: false } },
      (err) => {
        if (err) {
          res.status(500).json({
            status: "error",
            message: err,
          });
        } else {
          this.io.emit("SERVER:MESSAGES_READ", {
            userId,
            dialogId,
          });
        }
      }
    );
  };

  show = (req, res) => {
    const dialogId = req.query.dialog;
    const userId = req.user._id;

    Message.find({ dialog: dialogId })
      .populate(["dialog", "user", "attachments"])
      .exec((err, messages) => {
        if (err) {
          return res.status(404).json({ message: "Сообщение не найдено" });
        }
        Dialog.findOne({ _id: dialogId })
          .populate(["author", "partner"])
          .exec((err, dialog) => {
            if (err) {
              return res.status(404).json({ message: "Сообщение не найдено" });
            }
            const filterMessages = messages.filter((message) => {
              if (
                dialog &&
                dialog.author._id.toString() === userId &&
                !message.authorDeletedMessage
              ) {
                return message;
              }
              if (
                dialog &&
                dialog.partner._id.toString() === userId &&
                !message.partnerDeletedMessage
              ) {
                return message;
              }
            });
            this.updateReadStatus(res, userId, dialogId);
            return res.json(filterMessages);
          });
      });
  };

  create = (req, res) => {
    const userId = req.user._id;
    const postData = {
      text: req.body.text,
      user: userId,
      attachments: req.body.attachments,
      dialog: req.body.dialog_id,
    };

    const message = new Message(postData);

    this.updateReadStatus(res, userId, req.body.dialog_id);

    message
      .save()
      .then((obj) => {
        obj
          .populate(["dialog", "user", "attachments"])
          .then((msg) => {
            Dialog.findOneAndUpdate(
              { _id: postData.dialog },
              { lastMessage: message },
              { upsert: true },
              function (err) {
                if (err) {
                  return res.status(500).json({
                    status: "error",
                    message: err,
                  });
                }
              }
            );
            this.io.emit("SERVER:NEW_MESSAGE", msg);
            res.json(msg);
          })
          .catch((err) => {
            res.json(err);
          });
      })
      .catch((err) => res.json(err));
  };

  delete = (req, res) => {
    const id = req.params.id;
    const userId = req.user._id;

    Message.findById(id, (err, message) => {
      if (err || !message) {
        return res.status(404).json({
          status: "error",
          message: "Сообщение не найдено",
        });
      }
      if (message.user.toString() === userId) {
        const messageId = message._id;
        const dialogId = message.dialog;
        const authorId = message.user.toString();
        message.remove(() => {
          Message.findOne(
            { dialog: dialogId },
            {},
            { sort: { createdAt: -1 } },
            (err, lastMessage) => {
              if (err) {
                return res
                  .status(404)
                  .json({ message: "Сообщение не найдено" });
              }
              if (!lastMessage) {
                Dialog.findById(dialogId, (err, dialog) => {
                  if (err) {
                    return res
                      .status(404)
                      .json({ message: "Диалог не найден" });
                  }
                  if (dialog) {
                    dialog.remove(() => {
                      this.io.emit("SERVER:DIALOG_DELETED", dialogId);
                      return res.json({
                        status: "success",
                        message: "Диалог удалён",
                      });
                    });
                  }
                });
              } else {
                Dialog.findOne({ _id: dialogId })
                  .populate(["author", "partner"])
                  .exec((err, dialog) => {
                    Message.find({ dialog: dialogId })
                      .populate(["user"])
                      .exec((err, messages) => {
                        if (err) {
                          return res
                            .status(404)
                            .json({ message: "Сообщение не найдено" });
                        }
                        const filterMessages = messages.filter((message) => {
                          if (
                            dialog &&
                            userId === dialog.author._id.toString() &&
                            !message.authorDeletedMessage
                          ) {
                            return message;
                          }
                          if (
                            dialog &&
                            userId === dialog.partner._id.toString() &&
                            !message.partnerDeletedMessage
                          ) {
                            return message;
                          }
                        });
                        if (filterMessages.length === 0) {
                          if (
                            dialog &&
                            userId === dialog.author._id.toString()
                          ) {
                            dialog.authorDeletedDialog = true;
                            dialog.save(() => {
                              this.io.emit("SERVER:DIALOG_DELETED", dialogId);
                            });
                          }
                          if (
                            dialog &&
                            userId === dialog.partner._id.toString()
                          ) {
                            dialog.partnerDeletedDialog = true;
                            dialog.save(() => {
                              this.io.emit("SERVER:DIALOG_DELETED", dialogId);
                            });
                          }
                        } else {
                          lastMessage
                            .populate(["dialog", "user", "attachments"])
                            .then(() => {
                              Dialog.findById(dialogId, (err, dialog) => {
                                if (err) {
                                  return res.status(500).json({
                                    status: "error",
                                    message: err,
                                  });
                                }
                                if (!dialog) {
                                  return res.status(404).json({
                                    status: "Диалог не найден",
                                    message: err,
                                  });
                                }
                                dialog.lastMessage = lastMessage;
                                dialog.save(() => {
                                  this.io.emit("SERVER:MESSAGE_DELETED", {
                                    authorId: authorId,
                                    messageId: messageId,
                                    lastMessage: lastMessage,
                                  });
                                  return res.json({
                                    status: "success",
                                    message: "Message deleted",
                                    lastMessage: lastMessage,
                                  });
                                });
                              });
                            });
                        }
                      });
                  });
              }
            }
          );
        });
      } else {
        return res.status(403).json({
          status: "error",
          message: "Not have permission",
        });
      }
    });
  };
}

export default MessageController;
