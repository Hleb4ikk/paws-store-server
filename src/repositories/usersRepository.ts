import { db } from "../prisma/db.js";

export const findByEmail = (email: string) =>
  db.orm.public.User.where((u) => u.email.eq(email)).first();

export const createUser = (data: { email: string; password_hash: string }) =>
  db.orm.public.User.create(data);
