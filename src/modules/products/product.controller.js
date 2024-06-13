import { Product } from "../../../db/models/product.model.js";
import { Category } from "../../../db/models/category.model.js";
import { AsyncHandler } from "../../utils/AsyncHandler.js";
import cloudinary from "../../utils/cloud.js";
import slugify from "slugify";
import { Favorites } from "../../../db/models/favorite.model.js";

export const addProduct = AsyncHandler(async (req, res, next) => {
  const { name } = req.body;
  const { category } = req.body;

  // check category
  const checkCategory = await Category.findById({ _id: category });
  if (!checkCategory)
    return next(new Error("category not found"), { cause: 404 });

  // check file
  if (!req.files)
    return next(new Error("product image is required!", { cause: 400 }));

  // unique folder name
  let images = [];

  // upload images
  for (const file of req.files.subImages) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      { folder: `${process.env.FOLDER_CLOUD_NAME}/products/${name}/subImages` }
    );
    images.push({ id: public_id, url: secure_url });
  }

  // upload default image
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.files.defaultImage[0].path,
    { folder: `${process.env.FOLDER_CLOUD_NAME}/products/${name}/defaultimage` }
  );

  // create product
  const product = await Product.create({
    ...req.body,
    slug: slugify(name),
    createdBy: req.user._id,
    defaultImage: { url: secure_url, id: public_id },
    images,
    category: req.body.category,
  });

  const addToCategory = await Category.findByIdAndUpdate(
    category,
    { $push: { products: product.id } },
    { new: true }
  );
  console.log(addToCategory);
  const finalPrice = req.body.discount
    ? Number.parseFloat(
        product.price - (product.price * req.body.discount) / 100
      ).toFixed(2)
    : req.body.price;

  product.discount = req.body.discount;
  product.finalPrice = finalPrice;
  await product.save();

  res.json({ success: true, results: product });
});

export const addDiscount = AsyncHandler(async (req, res, next) => {
  // data
  const { discount } = req.body;

  // check product
  const product = await Product.findById({ _id: req.params.productId });
  if (!product) return next(new Error("product not found!"));

  if (discount) {
    const finalPrice = Number.parseFloat(
      product.price - (product.price * discount) / 100
    ).toFixed(2);
    product.discount = discount;
    product.finalPrice = finalPrice;
    await product.save();
    return res.json({
      success: true,
      message: "discount added successfully!",
      results: product,
    });
  }
  return res.json({ success: true, results: product });
});

export const removeDiscount = AsyncHandler(async (req, res, next) => {
  // check product
  const product = await Product.findByIdAndUpdate(
    { _id: req.params.productId },
    { $unset: { discount: 1, finalPrice: 0 } },
    { new: true }
  );
  if (!product) return next(new Error("product not found!"));

  product.finalPrice = product.price;
  product.save();

  return res.json({ success: true, results: product });
});

export const editProduct = AsyncHandler(async (req, res, next) => {
  const user = req.user._id;
  const ProductId = req.params.productId;
  const { newPrice, newAvailableItems } = req.body;

  console.log(ProductId);
  const editedProduct = await Product.findOneAndUpdate(
    { _id: ProductId },
    {
      price: newPrice,
      finalPrice: newPrice,
      availableItems: newAvailableItems,
    },
    { new: true } // Return the updated document
  );
  if (!editedProduct) {
    return res.status(404).json({ message: "Product not found" });
  }

  console.log(editedProduct);
  return res.status(200).json(editedProduct);
});

export const addToFavorite = AsyncHandler(async (req, res, next) => {
  const { productId } = req.body;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) return next(new Error("Product not found!", { cause: 404 }));

  // Check if product exists in user's favorites
  const checkProduct = await Favorites.findOne({
    user: req.user._id,
    "products.id": productId,
  });

  if (checkProduct) {
    return res.json({
      success: false,
      message: "Product already added to favorite",
    });
  }

  // Check if user has favorite schema
  const userFavorites = await Favorites.findOne({ user: req.user._id });
  if (userFavorites) {
    // Add to favorites
    const updatedFavorites = await Favorites.findOneAndUpdate(
      { user: req.user._id },
      { $push: { products: { id: productId } } },
      { new: true }
    ).populate("products");

    return res.json({
      success: true,
      message: "Product added to favorites successfully.",
      results: updatedFavorites,
    });
  } else {
    // Create user's favorites
    const newFavorites = await Favorites.create({
      user: req.user._id,
      products: [{ id: productId }],
    });

    return res.json({
      success: true,
      message: "Product added to favorites successfully.",
      results: newFavorites,
    });
  }
});

export const userFavorites = AsyncHandler(async (req, res, next) => {
  const user = req.user._id;

  // get favprites
  const favorite = await Favorites.findOne({ user }).populate("products.id");

  return res.json({ success: true, results: favorite });
});

export const removeFromFavorite = AsyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) return next(new Error("Product not found!", { cause: 404 }));

  // Check if user has favorite schema
  const userFavorites = await Favorites.findOne({ user: req.user._id });
  if (!userFavorites) {
    return res.json({
      success: false,
      message: "User has no favorite products",
    });
  }

  // Check if product exists in user's favorites
  const checkProduct = await Favorites.findOne({
    user: req.user._id,
    "products.id": productId,
  });

  if (!checkProduct) {
    return res.json({
      success: false,
      message: "Product not found in favorites",
    });
  }

  // Remove from favorites
  const updatedFavorites = await Favorites.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { products: { id: productId } } },
    { new: true }
  ).populate("products.id");

  return res.json({
    success: true,
    message: "Product removed from favorites successfully.",
    results: updatedFavorites,
  });
});

export const deleteProduct = AsyncHandler(async (req, res, next) => {
  // check product
  const product = await Product.findById(req.params.productId);
  if (!product) return next(new Error("product not found!"));

  // delete images
  const imageArr = product.images;
  const ids = imageArr.map((imageObj) => imageObj.id);
  ids.push(product.defaultImage.id);

  await cloudinary.api.delete_resources(ids);

  // delete folder
  await cloudinary.api.delete_folder(
    `${process.env.FOLDER_CLOUD_NAME}/products/${product.name}`
  );

  // delete product
  await Product.findByIdAndDelete(req.params.productId);

  // send response
  return res.json({ success: true, message: "product deleted successfully.." });
});

export const getAllProducts = AsyncHandler(async (req, res, next) => {
  if (req.params.categoryId) {
    const category = await Category.findById(req.params.categoryId);
    if (!category)
      return next(new Error("category not found!", { cause: 404 }));

    const product = await Product.find({
      category: req.params.categoryId,
    });
    return res.json({ success: true, results: product });
  }

  /* const { fields } = req.query;
  const { sort } = req.query;

  let page = parseInt(req.query.page) || 1;
  page = page < 1 ? 1 : page;
 */

  const products = await Product.find();
  /*  const products = await Product.find({ ...req.query })
    .paginate(page)
    .customSelect(fields)
    .sort(sort); */

  if (products.length < 1)
    return next(new Error("no products found!", { cause: 404 }));

  return res.json({ /* page */ success: true, results: products });
});

export const getSingleProduct = AsyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return next(new Error("product not found!", { cause: 404 }));

  return res.json({ success: true, results: product });
});
