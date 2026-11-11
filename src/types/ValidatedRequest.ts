import type { Request } from "express";
import z from "zod";

export type ValidatedRequest<
  BREQ = unknown,
  BRES = unknown,
  Q = unknown,
  P = unknown,
> = Request<
  P extends z.ZodType ? z.infer<P> : unknown,
  BRES extends z.ZodType ? z.infer<BRES> : unknown,
  BREQ extends z.ZodType ? z.infer<BREQ> : unknown,
  Q extends z.ZodType ? z.infer<Q> : unknown
>;
