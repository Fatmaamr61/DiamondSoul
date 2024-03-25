import { Schema, model } from "mongoose";

//schema
const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      min: 3,
      max: 20,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    forgetCode: String,
    activationCode: String,
    profileImage: {
      url: {
        type: String,
        default:
          "https://res.cloudinary.com/dc4zgmrmf/image/upload/v1692197970/ecommerce%20dafaults/user/blank-profile-picture-973460_1280_dogmy1.webp",
      },
      id: {
        type: String,
        default:
          "ecommerce%20dafaults/user/blank-profile-picture-973460_1280_dogmy1",
      },
    },
  },
  { timestamps: true }
);

// model
export const userModel = model("user", userSchema);
