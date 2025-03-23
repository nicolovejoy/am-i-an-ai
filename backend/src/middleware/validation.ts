import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";

/**
 * Validates request body against a Zod schema
 */
export const validateBody = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: error.errors,
      });
    }
  };
};

/**
 * Validates request query parameters against a Zod schema
 */
export const validateQuery = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error: any) {
      res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: error.errors,
      });
    }
  };
};

/**
 * Validates request params against a Zod schema
 */
export const validateParams = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error: any) {
      res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: error.errors,
      });
    }
  };
};
