import type { RequestHandler } from "express";
import * as productsService from "../services/productsService.js";
import { getValidated } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildCatalogCacheKey } from "../services/cacheService.js";
import type {
  CreateBody,
  IdParam,
  ListQuery,
  UpdateBody,
} from "../validators/productsValidators.js";

export const list: RequestHandler = asyncHandler(async (req, res) => {
  const { query } = getValidated<ListQuery>(res);
  const cacheKey = buildCatalogCacheKey(req.originalUrl);

  const { json, cacheHit } = await productsService.listProducts(
    query,
    cacheKey,
  );

  res.setHeader("X-Cache", cacheHit ? "HIT" : "MISS");
  res.type("application/json").send(json);
});

export const categories: RequestHandler = asyncHandler(async (_req, res) => {
  res.json(await productsService.listCategories());
});

export const getById: RequestHandler = asyncHandler(async (_req, res) => {
  const { params } = getValidated<IdParam>(res);
  res.json(await productsService.getProduct(params.id));
});

export const create: RequestHandler = asyncHandler(async (_req, res) => {
  const { body } = getValidated<CreateBody>(res);
  const product = await productsService.createProduct(body);
  res.status(201).json(product);
});

export const update: RequestHandler = asyncHandler(async (_req, res) => {
  const { params, body } = getValidated<IdParam & UpdateBody>(res);
  res.json(await productsService.updateProduct(params.id, body));
});

export const remove: RequestHandler = asyncHandler(async (_req, res) => {
  const { params } = getValidated<IdParam>(res);
  await productsService.deleteProduct(params.id);
  res.status(204).send();
});
