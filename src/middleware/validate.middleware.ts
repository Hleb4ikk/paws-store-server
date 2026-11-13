import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { z } from "zod";

export interface Validated<
  B extends z.ZodType = z.ZodType,
  Q extends z.ZodType = z.ZodType,
  P extends z.ZodType = z.ZodType,
> {
  body?: z.infer<B>;
  query?: z.infer<Q>;
  params?: z.infer<P>;
}

export const getValidated = <T>(res: Response): T =>
  res.locals["validated"] as T;

export const validate = (schemas: {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
}): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated: Record<string, unknown> = {};
      if (schemas.body) validated["body"] = schemas.body.parse(req.body);
      if (schemas.query) validated["query"] = schemas.query.parse(req.query);
      if (schemas.params) validated["params"] = schemas.params.parse(req.params);
      res.locals["validated"] = validated;
      next();
    } catch (err) {
      next(err);
    }
  };
};
