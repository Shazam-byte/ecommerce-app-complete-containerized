import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Middleware: Validate req.body against a Zod schema
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      
      // Construct a clean, consistent error response
      return res.status(400).json({
        error: "Input validation failed. Please check your data.",
        code: "VALIDATION_ERROR",
        details: fieldErrors,
      });
    }
    // Set parsed data back to req.body so fields are typed and clean
    req.body = result.data;
    next();
  };
}

/**
 * Middleware: Validate req.query against a Zod schema
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: "URL query parameter validation failed.",
        code: "VALIDATION_ERROR",
        details: result.error.flatten().fieldErrors,
      });
    }
    req.query = result.data as any;
    next();
  };
}
