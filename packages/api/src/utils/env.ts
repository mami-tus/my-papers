export const getGeminiApiKey = ({
  env,
}: {
  env: CloudflareBindings;
}): string => {
  return env.GEMINI_API_KEY;
};
