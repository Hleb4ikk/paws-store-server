import * as cartRepository from "../repositories/cartRepository.js";
import * as productsRepository from "../repositories/productsRepository.js";
import * as promocodesRepository from "../repositories/promocodesRepository.js";
import { badRequest, notFound } from "../utils/AppError.js";

const round2 = (value: number): number => Math.round(value * 100) / 100;

const serializeCart = (
  items: Awaited<ReturnType<typeof cartRepository.findItemsByUser>>,
) => {
  // productId is a required FK, so an included product is always present
  const rows = items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: { ...item.product!, price: Number(item.product!.price) },
  }));
  return {
    items: rows,
    subtotal: round2(
      rows.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    ),
  };
};

const getSerializedCart = async (userId: string) =>
  serializeCart(await cartRepository.findItemsByUser(userId));

export const getCart = (userId: string) => getSerializedCart(userId);

export const addItem = async (
  userId: string,
  productId: string,
  quantity: number,
) => {
  const product = await productsRepository.productExists(productId);
  if (!product) {
    throw notFound("Product not found");
  }

  const existing = await cartRepository.findItem(userId, productId);
  if (existing) {
    await cartRepository.updateItemQuantity(
      existing.id,
      existing.quantity + quantity,
    );
  } else {
    await cartRepository.createItem({ userId, productId, quantity });
  }

  return getSerializedCart(userId);
};

const findOwnedItem = async (userId: string, itemId: string) => {
  const item = await cartRepository.findItemById(itemId);
  if (!item || item.userId !== userId) {
    throw notFound("Cart item not found");
  }
  return item;
};

export const updateItem = async (
  userId: string,
  itemId: string,
  quantity: number,
) => {
  await findOwnedItem(userId, itemId);
  await cartRepository.updateItemQuantity(itemId, quantity);
  return getSerializedCart(userId);
};

export const removeItem = async (userId: string, itemId: string) => {
  await findOwnedItem(userId, itemId);
  await cartRepository.deleteItem(itemId);
  return getSerializedCart(userId);
};

export const applyPromo = async (userId: string, code: string) => {
  const promo = await promocodesRepository.findByCode(code.toUpperCase());
  if (!promo || !promo.is_active) {
    throw badRequest("Invalid or inactive promocode");
  }

  const items = await cartRepository.findItemsByUser(userId);
  if (items.length === 0) {
    throw badRequest("Cart is empty");
  }

  const cart = serializeCart(items);
  const discountAmount = round2(
    (cart.subtotal * promo.discount_percentage) / 100,
  );

  return {
    code: promo.code,
    discount_percentage: promo.discount_percentage,
    subtotal: cart.subtotal,
    discount_amount: discountAmount,
    total: round2(cart.subtotal - discountAmount),
    items: cart.items,
  };
};
