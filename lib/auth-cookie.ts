export const AUTH_TOKEN_COOKIE = "app-financeiro-token";

const AUTH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

let sessionEpoch = 0;

// In-memory identity for one login; never persisted or sent to the server.
export function getBrowserAuthSessionEpoch() {
  return sessionEpoch;
}

export function getBrowserAuthToken() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${AUTH_TOKEN_COOKIE}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1] ?? "") : null;
}

export function setBrowserAuthToken(token: string) {
  if (typeof document === "undefined") {
    return;
  }

  sessionEpoch++;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(
    token,
  )}; Path=/; Max-Age=${AUTH_TOKEN_MAX_AGE}; SameSite=Lax${secure}`;
}

export function clearBrowserAuthToken() {
  if (typeof document === "undefined") {
    return;
  }

  sessionEpoch++;

  document.cookie = `${AUTH_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
