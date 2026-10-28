import axios from "axios";

export function assistantErrorDetails(value: unknown) {
  const payload = axios.isAxiosError(value) ? value.response?.data : value;
  const data =
    typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};
  const code =
    [data.error_code, data.code].find(
      (item): item is string => typeof item === "string" && Boolean(item.trim()),
    ) ?? null;
  const message =
    [data.message, data.error, data.reply].find(
      (item): item is string => typeof item === "string" && Boolean(item.trim()),
    ) ?? null;
  const recognized = Boolean(code?.startsWith("assistant_") || code === "gemini_quota_exceeded");
  const retryAfterSeconds =
    typeof data.retry_after_seconds === "number" &&
    Number.isFinite(data.retry_after_seconds) &&
    data.retry_after_seconds > 0
      ? data.retry_after_seconds
      : null;
  return { code, message, recognized, retryAfterSeconds };
}
