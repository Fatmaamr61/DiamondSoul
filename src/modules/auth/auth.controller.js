import { AsyncHandler } from "../../utils/AsyncHandler.js";
import { userModel } from "../../../db/models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "../../utils/sendEmail.js";
import { passwordResetTemplate, signUpTemp } from "../../utils/generateHTML.js";
import jwt from "jsonwebtoken";
import { tokenModel } from "../../../db/models/token.model.js";
import randomstring from "randomstring";
import { cartModel } from "../../../db/models/cart.model.js";

export const register = AsyncHandler(async (req, res, next) => {
  // data from request
  const { userName, email, password } = req.body;

  // check user existance
  const isUser = await userModel.findOne({ email });
  if (isUser)
    return next(new Error("Email already registered", { cause: 409 }));

  // hash password
  const hashPassword = bcrypt.hashSync(password, parseInt(process.env.SALT));

  // generate activation code
  const activationCode = crypto.randomBytes(64).toString("hex");

  // create user
  const user = await userModel.create({
    userName,
    email,
    password: hashPassword,
    activationCode,
  });

  // create confirmation link
  const link = `http://localhost:5006/auth/confirmEmail/${activationCode}`;

  // send email
  const isSent = await sendEmail({
    to: email,
    subject: "activate account",
    html: signUpTemp(link),
  });

  // send response
  return isSent
    ? res.json({ success: true, message: "please check your email" })
    : next(new Error("something went wrong!"));
});

export const activateAccount = AsyncHandler(async (req, res, next) => {
  // find user, delete activation code, update isConfirmed
  const user = await userModel.findOneAndUpdate(
    { activationCode: req.params.activationCode },
    {
      isConfirmed: true,
      $unset: { activationCode: 1 },
    }
  );

  // check if user doesn't exist
  if (!user) return next(new Error("user not found!!", { cause: 404 }));

  // create a cart
  await cartModel.create({ user: user._id });

  // send response
  return res.send(
    "congratulations your account is now activated!, you can login now"
  );
});

export const login = AsyncHandler(async (req, res, next) => {
  // data from request
  const { email, password } = req.body;

  // check user
  const user = await userModel.findOne({ email });
  if (!user) return next(new Error("invalid email!", { cause: 400 }));

  // check is confrirmed
  if (!user.isConfirmed)
    return next(new Error("un activated account!!", { cause: 400 }));

  // check password
  const pass = bcrypt.compareSync(password, user.password);
  if (!pass) return next(new Error("Wrong password", { cause: 400 }));

  // generate token
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.TOKEN_KEY,
    { expiresIn: "2d" }
  );

  // save token in token model
  await tokenModel.create({
    token,
    user: user._id,
    agent: req.headers["user-agent"],
  });

  // change user status to online and save
  user.status = "online";
  await user.save();

  // send response
  return res.json({ success: true, results: token });
});

export const changePassword = AsyncHandler(async (req, res, next) => {
  // data from request
  let { oldPassword, newPassword } = req.body;
  const id = req.user._id;

  // find user
  const user = await userModel.findById(id);

  // check old password
  const pass = bcrypt.compareSync(oldPassword, user.password);
  if (!pass)
    return next(new Error("Wrong password, try again", { cause: 400 }));

  // change password
  user.password = bcrypt.hashSync(
    req.body.newPassword,
    parseInt(process.env.SALT)
  );
  await user.save();

  // send response
  return res.json({
    success: true,
    results: "password changed successfully !",
  });
});

export const sendForgetCode = AsyncHandler(async (req, res, next) => {
  // check user
  const user = await userModel.findOne({ email: req.body.email });

  if (!user) return next(new Error("email is not exist!", { cause: 404 }));

  // generate code
  const code = randomstring.generate({
    length: 5,
    charset: "numeric",
  });

  // save code in db
  user.forgetCode = code;
  await user.save();

  // send email
  const emailCode = (await sendEmail({
    to: user.email,
    subject: "Reset Password",
    html: passwordResetTemplate(code),
  }))
    ? res.json({ success: true, results: "check your email!" })
    : next(new Error("something went wrong"));
});

export const resetPassword = AsyncHandler(async (req, res, next) => {
  // check user
  let user = await userModel.findOne({ email: req.body.email });
  if (!user) return next(new Error("Invalid Email!", { cause: 400 }));

  // check code
  if (user.forgetCode !== req.body.forgetCode)
    return next(new Error("Invalid code!", { cause: 400 }));

  user = await userModel.findOneAndUpdate(
    { email: req.body.email },
    { $unset: { forgetCode: 1 } }
  );

  user.password = bcrypt.hashSync(
    req.body.password,
    parseInt(process.env.SALT)
  );
  await user.save();

  // invalidate tokens
  const tokens = await tokenModel.find({ user: user._id });

  tokens.forEach(async (token) => {
    token.isValid = false;
    await token.save();
  });

  // response
  return res.json({
    success: true,
    message: "password reset successfully, try to login !",
  });
});

export const logOut = AsyncHandler(async (req, res, next) => {
  const id = req.user._id;
  let { token } = req.headers;

  token = token.split(process.env.BEARER)[1];
  const removeToken = await tokenModel.findOneAndUpdate(
    { token },
    { isValid: false },
    { new: true }
  );

  return res.status(202).json({ success: true, message: `You are logged Out` });
});

export const deleteAccount = AsyncHandler(async (req, res, next) => {
  const id = req.user._id;
  let { token } = req.headers;

  // delete user
  const user = await userModel.findByIdAndDelete(id);

  // delete token
  token = token.split(process.env.BEARER)[1];
  const removeToken = await tokenModel.findOneAndDelete({ token });

  return res
    .status(202)
    .json({ success: true, message: `user deleted successfully..` });
});
