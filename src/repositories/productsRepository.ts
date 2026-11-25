import { or, orderByField } from "@prisma/orm-postgres/orm-client";
import { db } from "../prisma/db.js";

export interface ProductListParams {
  page: number;
  limit: number;
  search?: string | undefined;
  category?: string | undefined;
  min_price?: number | undefined;
  max_price?: number | undefined;
  min_rating?: number | undefined;
  sort_by?: "price" | "title" | undefined;
  order: "asc" | "desc";
}

export interface CreateProductData {
  title: string;
  description: string;
  price: string;
  rating?: number;
  category?: string;
  stock_quantity?: number;
}

export type UpdateProductData = Record<string, unknown>;

export const listProducts = async (params: ProductListParams) => {
  let filtered = db.orm.public.Product;
  if (params.search) {
    const term = `%${params.search}%`;
    filtered = filtered.where((p) =>
      or(p.title.ilike(term), p.description.ilike(term)),
    );
  }
  if (params.category) {
    const category = params.category;
    filtered = filtered.where((p) => p.category.eq(category));
  }
  if (params.min_price !== undefined) {
    const min = String(params.min_price);
    filtered = filtered.where((p) => p.price.gte(min));
  }
  if (params.max_price !== undefined) {
    const max = String(params.max_price);
    filtered = filtered.where((p) => p.price.lte(max));
  }
  if (params.min_rating !== undefined) {
    const minRating = params.min_rating;
    filtered = filtered.where((p) => p.rating.gte(minRating));
  }

  const ordered = params.sort_by
    ? filtered.orderBy(
        orderByField(filtered, params.sort_by, params.order, [
          "price",
          "title",
        ]),
      )
    : filtered;

  const { total } = await filtered.aggregate((a) => ({ total: a.count() }));

  const items = await ordered
    .include("images")
    .limit(params.limit)
    .offset((params.page - 1) * params.limit)
    .all();

  return { items, total };
};

export const listCategories = async () => {
  const groups = await db.orm.public.Product.groupBy("category").aggregate(
    (a) => ({ count: a.count() }),
  );
  return groups
    .map((g) => ({ name: g.category, count: g.count }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const findProductById = (id: string) =>
  db.orm.public.Product.where({ id }).include("images").first();

export const productExists = (id: string) =>
  db.orm.public.Product.first({ id });

export const createProduct = (data: CreateProductData, imageUrls: string[]) =>
  db.transaction(async (tx) => {
    const created = await tx.orm.public.Product.create(data);
    for (const url of imageUrls) {
      await tx.orm.public.Image.create({ productId: created.id, url });
    }
    return tx.orm.public.Product.where({ id: created.id })
      .include("images")
      .first();
  });

export const updateProduct = async (
  id: string,
  data: UpdateProductData,
  imageUrls?: string[],
) => {
  await db.transaction(async (tx) => {
    if (Object.keys(data).length > 0) {
      await tx.orm.public.Product.where({ id }).update(data);
    }
    if (imageUrls !== undefined) {
      await tx.orm.public.Image.where({ productId: id }).deleteAll();
      for (const url of imageUrls) {
        await tx.orm.public.Image.create({ productId: id, url });
      }
    }
  });
  return db.orm.public.Product.where({ id }).include("images").first();
};

export const deleteProduct = (id: string) =>
  db.orm.public.Product.where({ id }).delete();
