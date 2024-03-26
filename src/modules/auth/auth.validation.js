import joi from "joi";

// register
export const registerSchema = joi
  .object({
    userName: joi.string().min(3).max(20).required(),
    email: joi
      .string()
      .email({
        minDomainSegments: 2,
        maxDomainSegments: 3,
        tlds: { allow: ["com", "net", "edu", "org"] },
      })
      .required(),
    password: joi.string().required(),
    cPassword: joi.string().valid(joi.ref("password")).required(),
  })
  .required();

// activate account
export const activateSchema = joi
  .object({
    activationCode: joi.string().required(),
  })
  .required();

// login
export const loginSchema = joi
  .object({
    email: joi
      .string()
      .email({
        minDomainSegments: 2,
        maxDomainSegments: 3,
        tlds: { allow: ["com", "net", "edu", "org"] },
      })
      .required(),
    password: joi.string().required(),
  })
  .required();

// change password
export const changePasswordSchema = joi
  .object({
    oldPassword: joi.string().required(),
    newPassword: joi.string().required(),
    cPassword: joi.string().valid(joi.ref("newPassword")).required(),
  })
  .required();

// send forget code
export const sendForgetCodeSchema = joi
  .object({
    email: joi
      .string()
      .email({
        minDomainSegments: 2,
        maxDomainSegments: 3,
        tlds: { allow: ["com", "net", "edu", "org"] },
      })
      .required(),
  })
  .required();

// set forget code
export const setForgetCodeSchema = joi
  .object({
    forgetCode: joi.string().required(),
  })
  .required();

// reset password
export const resetPasswordSchema = joi
  .object({
    forgetCode: joi.string().required(),
    password: joi.string().required(),
    cPassword: joi.string().valid(joi.ref("password")).required(),
  })
  .required();
