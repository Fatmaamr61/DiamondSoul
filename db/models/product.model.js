import mongoose, { Schema, Types, model } from "mongoose";

const productSchema = new Schema(
  {
    name: { type: String, required: true, min: 2, max: 20 },
    price: { type: Number, required: true, min: 1 },
    description: { type: String },
    slug: { type: String, required: true },
    images: [
      {
        id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    defaultImage: {
      id: { type: String, required: true },
      url: { type: String, required: true },
    },
    availableItems: { type: Number, min: 1, required: true },
    soldItems: { type: Number, min: 0 },
    discount: { type: Number, min: 1, max: 100 },
    finalPrice: { type: Number },
    createdBy: { type: Types.ObjectId, ref: "user", required: true },
    category: { type: Types.ObjectId, ref: "category" },
    cloudFolder: { type: String, unique: true },
  },
  { timestamps: true }
);

productSchema.query.paginate = function (page) {
  page = !page || page < 1 || isNaN(page) ? 1 : page;
  const limit = 2;
  const skip = limit * (page - 1);
  return this.skip(skip).limit(limit);
};

productSchema.query.customSelect = function (fields) {
  if (!fields) return this;
  // model keys
  const modelKeys = Object.keys(productModel.schema.paths);
  // query keys
  const queryKeys = fields.split(" ");
  // matched keys
  const matchedKeys = queryKeys.filter((key) => modelKeys.includes(key));
  return this.select(matchedKeys);
};

productSchema.query.filter = function (keyword) {
  if (!keyword) return this;
  return this.where({
    $or: [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ],
  });
};

// stock function
productSchema.methods.inStock = function (requiredQuantity) {
  // this >> doc
  return this.availableItems >= requiredQuantity ? true : false;
};

// model
export const productModel =
  mongoose.models.productModel || model("product", productSchema);
