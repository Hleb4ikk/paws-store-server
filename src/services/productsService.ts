import * as productsRepository from "../repositories/productsRepository.js";
import type {
  CreateProductData,
  ProductListParams,
} from "../repositories/productsRepository.js";
import {
  getCached,
  setCached,
  invalidateCatalogCache,
} from "./cacheService.js";
import { notFound } from "../utils/AppError.js";

export const serializeProduct = <T extends { price: unknown }>(
  product: T,
) => ({
  ...product,
  price: Number(product.price),
});

export const listProducts = async (
  params: ProductListParams,
  cacheKey: string,
): Promise<{ json: string; cacheHit: boolean }> => {
  const cached = await getCached(cacheKey);
  if (cached) {
    return { json: cached, cacheHit: true };
  }

  const { items, total } = await productsRepository.listProducts(params);

  const payload = {
    items: items.map(serializeProduct),
    meta: {
      total_items: total,
      total_pages: Math.ceil(total / params.limit),
      current_page: params.page,
      limit: params.limit,
    },
  };

  const json = JSON.stringify(payload);
  await setCached(cacheKey, json);
  return { json, cacheHit: false };
};

export const listCategories = async () => ({
  categories: await productsRepository.listCategories(),
});

export const getProduct = async (id: string) => {
  const product = await productsRepository.findProductById(id);
  if (!product) {
    throw notFound("Product not found");
  }
  return serializeProduct(product);
};

export interface CreateProductInput {
  title: string;
  description: string;
  price: number;
  rating?: number | undefined;
  category?: string | undefined;
  stock_quantity?: number | undefined;
  images: string[];
}

export interface UpdateProductInput {
  title?: string | undefined;
  description?: string | undefined;
  price?: number | undefined;
  rating?: number | undefined;
  category?: string | undefined;
  stock_quantity?: number | undefined;
  images?: string[] | undefined;
}

export const createProduct = async (input: CreateProductInput) => {
  const data: CreateProductData = {
    title: input.title,
    description: input.description,
    price: String(input.price),
    ...(input.rating !== undefined ? { rating: input.rating } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.stock_quantity !== undefined
      ? { stock_quantity: input.stock_quantity }
      : {}),
  };

  const product = await productsRepository.createProduct(data, input.images);
  await invalidateCatalogCache();
  return serializeProduct(product!);
};

export const updateProduct = async (
  id: string,
  input: UpdateProductInput,
) => {
  const existing = await productsRepository.productExists(id);
  if (!existing) {
    throw notFound("Product not found");
  }

  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data["title"] = input.title;
  if (input.description !== undefined) data["description"] = input.description;
  if (input.price !== undefined) data["price"] = String(input.price);
  if (input.rating !== undefined) data["rating"] = input.rating;
  if (input.category !== undefined) data["category"] = input.category;
  if (input.stock_quantity !== undefined)
    data["stock_quantity"] = input.stock_quantity;

  const product = await productsRepository.updateProduct(
    id,
    data,
    input.images,
  );

  await invalidateCatalogCache();
  return serializeProduct(product!);
};

export const deleteProduct = async (id: string) => {
  const existing = await productsRepository.productExists(id);
  if (!existing) {
    throw notFound("Product not found");
  }

  // Images and cart items are removed by ON DELETE CASCADE
  await productsRepository.deleteProduct(id);
  await invalidateCatalogCache();
};
