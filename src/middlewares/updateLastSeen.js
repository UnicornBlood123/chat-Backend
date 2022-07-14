import User from "../models/user.js";

const updateLastSeen = (req, __, next) => {
  req.user &&
    User.updateOne(
      { _id: req.user._id },
      {
        $set: {
          last_seen: new Date(),
        },
      },
      () => {}
    );
  next();
};

export default updateLastSeen;
