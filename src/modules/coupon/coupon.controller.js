import { AsyncHandler } from "../../utils/AsyncHandler.js";
import voucher_codes from "voucher-code-generator";
import { Coupon } from "../../../db/models/coupon.model.js";

// create
export const createCoupon = AsyncHandler(async (req, res, next) => {
  // generate code
  const code = voucher_codes.generate({ length: 5 });
  console.log(code);
  // create coupon
  const coupon = await Coupon.create({
    name: code[0],
    discount: req.body.discount,
    expiredAt: new Date(req.body.expiredAt).getTime(),
    createdBy: req.user._id,
  });

  return res.status(201).json({ success: true, results: coupon });
});

export const updateCoupon = AsyncHandler(async (req, res, next) => {
  // check coupon
  const coupon = await Coupon.findOne({
    name: req.params.code,
    expiredAt: { $gt: Date.now() },
  });
  if (!coupon) return next(new Error("Invalid code!"));

  // check owner
  if (req.user._id != coupon.createdBy.toString())
    return next(new Error("not Authorized!"));

  coupon.discount = req.body.discount ? req.body.discount : coupon.discount;
  coupon.expiredAt = req.body.expiredAt
    ? new Date(req.body.expiredAt).getTime()
    : coupon.expiredAt;
  await coupon.save();

  res.json({
    success: true,
    message: "coupon updated successfully!",
    results: coupon,
  });
});

export const deleteCoupon = AsyncHandler(async (req, res, next) => {
  // check coupon
  const coupon = await Coupon.findOne({
    name: req.params.code,
  });
  if (!coupon) return next(new Error("Invalid code!"));

  // check owner
  /* if (req.user._id.toString() !== coupon.createdBy.toString())
    return next(new Error("not Authorized!")); */

  // delete coupon
  await Coupon.findOneAndDelete(req.params.code);

  return res.json({ success: true, message: "coupon deleted successfully!" });
});

export const allCoupons = AsyncHandler(async (req, res, next) => {
  const coupons = await Coupon.find();
  if (coupons.length < 1)
    return next(new Error("no coupons found!!", { cause: 404 }));

  return res.json({ success: true, results: coupons });
});
