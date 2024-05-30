import { AsyncHandler } from "../../utils/AsyncHandler.js";
import { Category } from "../../../db/models/category.model.js";
import slugify from "slugify";
import cloudinary from "../../utils/cloud.js";

export const createCategory = AsyncHandler(async (req, res, next) => {
  const { name } = req.body;
  console.log("nammee", name);
  // file
  if (!req.file) return next(new Error("category image is required!"));

  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    { folder: `${process.env.FOLDER_CLOUD_NAME}/category/${name}` }
  );
  console.log("testt");

  // save category in db
  const category = await Category.create({
    name,
    createdBy: req.user._id,
    image: { id: public_id, url: secure_url },
    slug: slugify(req.body.name),
  });

  // send response
  return res.status(201).json({ success: true, results: category });
});

export const updateCategory = AsyncHandler(async (req, res, next) => {
  // Retrieve the category by ID
  const category = await Category.findById(req.params.categoryId);
  if (!category) {
    return next(new Error("Category not found!"));
  }

  // Update name and slug if provided
  if (req.body.name) {
    category.name = req.body.name;
    category.slug = slugify(req.body.name);
  }

  // Update the image if a file is provided
  if (req.file) {
    const { public_id, secure_url } = await cloudinary.uploader.upload(
      req.file.path,
      {
        public_id: category.image.id, // Make sure this corresponds to an existing field
      }
    );
    // Update the image information
    category.image = { url: secure_url, id: public_id };
  }

  // Save all changes made to the category
  const updatedCategory = await category.save();

  // Return the updated category information
  return res.json({ success: true, results: updatedCategory });
});

export const deleteCategory = AsyncHandler(async (req, res, next) => {
  // check category and delete
  const category = await Category.findByIdAndDelete(req.params.categoryId);
  if (!category) return next(new Error("category not found!"));

  // delete image
  const result = await cloudinary.uploader.destroy(category.image.id);
  console.log(result);

  // send response
  return res.json({
    success: true,
    message: "category deleted successfully..",
  });
});

export const getAllCategories = AsyncHandler(async (req, res, next) => {
  const categories = await Category.find();
  if (categories.length < 1)
    return next(new Error("no categories found!", { cause: 404 }));

  return res.json({ success: true, results: categories });
});

export const getCategoryById = AsyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const category = await Category.findById(categoryId);
  return res.json({ success: true, results: category });
});
