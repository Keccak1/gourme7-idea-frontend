/**
 * Transformer to fix/filter problematic OpenAPI operations
 * Some endpoints have malformed path params (named "0" instead of proper names)
 */

interface OpenAPISpec {
  paths?: Record<string, unknown>;
  [key: string]: unknown;
}

export default (inputSpec: OpenAPISpec): OpenAPISpec => {
  const spec = structuredClone(inputSpec);

  // Remove problematic endpoints with malformed path params
  const pathsToRemove = ['/agents/{id}/notes/{path}'];

  for (const pathToRemove of pathsToRemove) {
    if (spec.paths && spec.paths[pathToRemove]) {
      delete spec.paths[pathToRemove];
    }
  }

  return spec;
};
