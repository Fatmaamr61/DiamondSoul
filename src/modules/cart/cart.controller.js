import { AsyncHandler } from "../../utils/AsyncHandler.js";
import { Product } from "../../../db/models/product.model.js";
import { Cart } from "../../../db/models/cart.model.js";

// add to cart
export const addToCart = AsyncHandler(async (req, res, next) => {
  // data
  const { product, quantity } = req.body;

  // check product
  const checkProduct = await Product.findById(product);
  if (!checkProduct)
    return next(new Error("product not found", { cause: 404 }));

  // check stock
  if (!checkProduct.inStock(quantity))
    return next(
      new Error(
        `sorry!! only ${checkProduct.availableItems} items left in the stock..`
      )
    );

  // check product in cart
  const checkCart = await Cart.findOne({
    user: req.user._id,
    "products.product": product,
  });

  //console.log("checkCart: ", checkCart);

  if (checkCart) {
    const newQuantity = quantity + checkCart.products[0].quantity;

    if (!checkProduct.inStock(newQuantity))
      return next(
        new Error(
          `sorry!! only ${checkProduct.availableItems} items left in the stock..`
        )
      );

    // update products
    const updateCart = await Cart.findOneAndUpdate(
      {
        user: req.user._id,
        "products.product": product,
      },
      { $set: { "products.$.quantity": newQuantity } },
      { new: true }
    );

    // Calculate intial total price
    const cartPrice = await Cart.findOne({ user: req.user._id }).populate(
      "products.product",
      "price discount finalPrice"
    );

    console.log("pricee: ", cartPrice.produ);

    let intialTotalPrice = 0;
    cartPrice.products.forEach((item) => {
      intialTotalPrice += item.product.price * item.quantity;
    });

    const updateTotalPrice = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { intialTotalPrice }
    );

    //console.log("update total zft: ", updateTotalPrice);

    // get cart
    const updatedCart = await Cart.findOne({ user: req.user._id }).populate(
      "products.product",
      "name defaultImage.url price discount finalPrice"
    );

    //console.log("updatedCart", updatedCart);
    //console.log(intialTotalPrice);
    // Update the intialTotalPrice in the cart

    // response
    return res.json({
      success: true,
      message: "product added successfully",
      results: updatedCart,
    });
  } else {
    // add to cart
    const updateCart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $push: { products: { product, quantity } } },
      { new: true }
    );

    // Calculate intial total price
    const cartPrice = await Cart.findOne({ user: req.user._id }).populate(
      "products.product",
      "price discount finalPrice"
    );

    let intialTotalPrice = 0;
    cartPrice.products.forEach((item) => {
      intialTotalPrice += item.product.price * item.quantity;
    });

    // Update the intialTotalPrice in the cart
    const updatedTotalPriceCart = await Cart.findByIdAndUpdate(cartPrice._id, {
      intialTotalPrice,
    });

    // get cart
    const cartData = await Cart.findOne({ user: req.user._id }).populate(
      "products.product",
      "name defaultImage.url price discount finalPrice"
    );

    // response
    return res.json({
      success: true,
      message: "new product added successfully",
      results: cartData,
    });
  }
});

// get user cart
export const userCart = AsyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "products.product",
    "name defaultImage.url price discount finalPrice"
  );

  return res.json({ success: true, result: cart });
});

// update cart
export const updateCart = AsyncHandler(async (req, res, next) => {
  // data
  const { product, quantity } = req.body;

  // check product
  const checkProduct = await Product.findById(product);
  if (!checkProduct)
    return next(new Error("product not found", { cause: 404 }));

  // check stock
  if (quantity > product.availableItems)
    return next(
      new Error(
        `sorry!! only ${product.availableItems} items left in the stock..`
      )
    );

  // update products
  const cart = await Cart.findOneAndUpdate(
    {
      user: req.user._id,
      "products.product": product,
    },
    { $set: { "products.$.quantity": quantity } },
    { new: true }
  );

  // Calculate intial total price
  const cartPrice = await Cart.findOne({ user: req.user._id }).populate(
    "products.product",
    "price discount finalPrice"
  );

  let intialTotalPrice = 0;
  cartPrice.products.forEach((item) => {
    intialTotalPrice += item.product.price * item.quantity;
  });

  const updateTotalPrice = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { intialTotalPrice }
  );

  // get cart
  const cartData = await Cart.findOne({ user: req.user._id }).populate(
    "products.product",
    "name defaultImage.url price discount finalPrice"
  );

  return res.json({
    success: true,
    message: "cart updated !!",
    results: cartData,
  });
});

// remove product from cart
export const removeProductFromCart = AsyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { products: { product: req.params.product } },
    },
    { new: true }
  );

  // Calculate intial total price
  const cartPrice = await Cart.findOne({ user: req.user._id }).populate(
    "products.product",
    "price discount finalPrice"
  );

  let intialTotalPrice = 0;
  cartPrice.products.forEach((item) => {
    intialTotalPrice += item.product.price * item.quantity;
  });

  const updateTotalPrice = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { intialTotalPrice }
  );

  // get cart
  const cartData = await Cart.findOne({ user: req.user._id }).populate(
    "products.product",
    "name defaultImage.url price discount finalPrice"
  );
  
  return res.json({
    success: true,
    message: "product deleted successfully!!",
    results: cartData,
  });
});

// clear cart
export const clearCart = AsyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { products: [] },
    { new: true }
  );

  cart.intialTotalPrice = 0;
  cart.save();

  return res.json({ success: true, message: "cart cleared!", results: cart });
});
