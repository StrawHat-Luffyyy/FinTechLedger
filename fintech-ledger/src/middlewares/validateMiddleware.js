export const validate = (schema) => (req, res, next) => {
  // Use safeParse to avoid throwing errors
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    // Format Zod validation errors safely
    // ZodError uses 'issues' not 'errors'
    const issues = result.error?.issues || [];
    return res.status(400).json({
      error: "Validation Failed",
      details: issues.map((e) => {
        // Strip the first part of the path (body/params/query) to get just the field name
        const fieldPath = e.path.slice(1);
        const field = fieldPath.length > 0 ? fieldPath.join(".") : "unknown";
        return {
          field,
          message: e.message,
        };
      }),
    });
  }

  // Assign parsed/validated data back to request object
  // so downstream handlers receive coerced/defaulted/refined values
  if (result.data?.body !== undefined) req.body = result.data.body;
  if (result.data?.params !== undefined) req.params = result.data.params;
  if (result.data?.query !== undefined) req.query = result.data.query;

  next();
};
