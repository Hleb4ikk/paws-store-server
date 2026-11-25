import { db } from "../prisma/db.js";

export const findItemsByUser = (userId: string) =>
  db.orm.public.CartItems.where({ userId })
    .include("product", (product) => product.include("images"))
    .all();

export const findItemById = (id: string) =>
  db.orm.public.CartItems.first({ id });

export const findItem = (userId: string, productId: string) =>
  db.orm.public.CartItems.where({ userId, productId }).first();

export const createItem = (data: {
  userId: string;
  productId: string;
  quantity: number;
}) => db.orm.public.CartItems.create(data);

export const updateItemQuantity = (id: string, quantity: number) =>
  db.orm.public.CartItems.where({ id }).update({ quantity });

export const deleteItem = (id: string) =>
  db.orm.public.CartItems.where({ id }).delete();
