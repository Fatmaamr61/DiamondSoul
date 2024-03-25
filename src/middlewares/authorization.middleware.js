import { AsyncHandler } from "../utils/AsyncHandler.js";

export const isAuthorized = (role) => {
  return AsyncHandler(async (req, res, next) => {
    // check user
    if (role !== req.user.role)
      return next(new Error("you are not authorized!", { cause: 403 }));
    return next();
  });
};
