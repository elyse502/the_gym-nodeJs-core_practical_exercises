/**
 * Returns environment variables while masking
 * sensitive values.
 */
export function getMaskedEnvironmentVariables() {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    const isSensitive =
      key.includes("SECRET") || key.includes("KEY") || key.includes("PASSWORD");

    result[key] = isSensitive ? "***" : String(value);
  }

  return result;
}
