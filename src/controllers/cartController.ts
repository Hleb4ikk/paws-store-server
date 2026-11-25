import type { RequestHandler } from "express";
import * as cartService from "../services/cartService.js";
import { getValidated } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type {
  AddItemBody,
  ItemIdParam,
  PromoBody,
  UpdateItemBody,
} from "../validators/cartValidators.js";

export const getCart: RequestHandler = asyncHandler(async (req, res) => {
  res.json(await cartService.getCart(req.user!.id));
});

export const addItem: RequestHandler = asyncHandler(async (req, res) => {
  const { body } = getValidated<AddItemBody>(res);
  const cart = await cartService.addItem(
    req.user!.id,
    body.productId,
    body.quantity,
  );
  res.status(201).json(cart);
});

export const updateItem: RequestHandler = asyncHandler(async (req, res) => {
  const { params, body } = getValidated<ItemIdParam & UpdateItemBody>(res);
  res.json(await cartService.updateItem(req.user!.id, params.id, body.quantity));
});

export const removeItem: RequestHandler = asyncHandler(async (req, res) => {
  const { params } = getValidated<ItemIdParam>(res);
  res.json(await cartService.removeItem(req.user!.id, params.id));
});

export const applyPromo: RequestHandler = asyncHandler(async (req, res) => {
  const { body } = getValidated<PromoBody>(res);
  res.json(await cartService.applyPromo(req.user!.id, body.code));
});
