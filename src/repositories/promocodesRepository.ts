import { db } from "../prisma/db.js";

export const findByCode = (code: string) =>
  db.orm.public.Promocode.where((p) => p.code.eq(code)).first();
