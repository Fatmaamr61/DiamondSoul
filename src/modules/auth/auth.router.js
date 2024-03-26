import { Router } from "express";
import { isValid } from "../../middlewares/validation.middleware.js";
import {
  activateSchema,
  changePasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  sendForgetCodeSchema,
  setForgetCodeSchema,
} from "./auth.validation.js";
import {
  activateAccount,
  changePassword,
  deleteAccount,
  logOut,
  login,
  register,
  resetPassword,
  sendForgetCode,
  setForgetCode,
} from "./auth.controller.js";
import { isAuthenticated } from "../../middlewares/authentcation.middleware.js";
const router = Router();

// register
router.post("/register", isValid(registerSchema), register);

// activate account
router.get(
  "/confirmEmail/:activationCode",
  isValid(activateSchema),
  activateAccount
);

// login
router.post("/login", isValid(loginSchema), login);

// change password
router.patch(
  "/changePassword",
  isAuthenticated,
  isValid(changePasswordSchema),
  changePassword
);

// send forget password code
router.patch("/forgetCode/send", isValid(sendForgetCodeSchema), sendForgetCode);

// set forget code
router.post("/forgetCode/set", isValid(setForgetCodeSchema), setForgetCode);

// reset password
router.patch("/resetPassword", isValid(resetPasswordSchema), resetPassword);


// logOut
router.get("/logout", isAuthenticated, logOut);

// delete account
router.delete("/account/delete", isAuthenticated, deleteAccount);

export default router;
