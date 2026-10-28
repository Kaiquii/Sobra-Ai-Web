import axios from "axios";

import { getBrowserAuthSessionEpoch, getBrowserAuthToken } from "@/lib/auth-cookie";

const requestSessionEpochs = new WeakMap<object, number>();

export function getApiRequestSessionEpoch(config: object | undefined) {
  return config ? requestSessionEpochs.get(config) : undefined;
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function buildApiAssetUrl(
  path: string | null | undefined,
  cacheKey?: number | null,
) {
  if (!path) {
    return null;
  }

  const appendCacheKey = (url: string) => {
    if (!cacheKey) {
      return url;
    }

    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${cacheKey}`;
  };

  if (/^https?:\/\//i.test(path)) {
    return appendCacheKey(path);
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    return appendCacheKey(path);
  }

  return appendCacheKey(
    `${apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
  );
}

apiClient.interceptors.request.use((config) => {
  requestSessionEpochs.set(config, getBrowserAuthSessionEpoch());
  const token = getBrowserAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});
