import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import axios from "axios";
import ts from "typescript";

const require = createRequire(import.meta.url);
function loadTs(path, mocks = {}, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    process: { env: { NODE_ENV: "test", NEXT_PUBLIC_API_BASE_URL: "https://backend.invalid" } },
    require: (name) => name in mocks ? mocks[name] : require(name),
    ...globals,
  });
  return exports;
}

function deferred() {
  let resolve;
  const promise = new Promise((yes) => { resolve = yes; });
  return { promise, resolve };
}

function fixture() {
  let cookieValue = "";
  const document = {};
  Object.defineProperty(document, "cookie", {
    get: () => cookieValue,
    set: (value) => { cookieValue = value.includes("Max-Age=0") ? "" : value.split(";")[0]; },
  });
  const cookie = loadTs("../lib/auth-cookie.ts", {}, {
    document,
    window: { location: { protocol: "https:" } },
  });
  const api = loadTs("../lib/api.ts", { "@/lib/auth-cookie": cookie });
  const errors = loadTs("../lib/api-errors.ts");
  let authenticated = true;
  const logouts = [];
  const navigations = [];
  const state = {
    get isAuthenticated() { return authenticated; },
    logout: (message) => {
      logouts.push(message);
      cookie.clearBrowserAuthToken();
      authenticated = false;
    },
  };
  const effects = [];
  const { Providers } = loadTs("../app/providers.tsx", {
    react: { useEffect: (effect) => effects.push(effect) },
    "next/navigation": {
      usePathname: () => "/inicio",
      useRouter: () => ({ replace: (url) => navigations.push(url) }),
    },
    "@/features/auth/store/useAuthStore": { useAuthStore: { getState: () => state } },
    "@/lib/api": api,
    "@/lib/api-errors": errors,
    "@/lib/auth-cookie": cookie,
    "@/store/useThemeStore": { useThemeStore: (select) => select({ theme: "dark" }) },
    "@/lib/theme": { applyBrowserTheme: () => {} },
  });
  const login = (token = "session-A") => {
    cookie.setBrowserAuthToken(token);
    authenticated = true;
  };
  login();
  Providers({ children: "test" });
  // The other effects manage browser theme/PWA; execute only the real API effect.
  const cleanup = effects.at(-1)();
  const captured = [];
  api.apiClient.defaults.adapter = async (config) => {
    captured.push(config);
    return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config };
  };
  function rejectWith(status, data = { message: "Mensagem da API." }) {
    const entered = deferred();
    const release = deferred();
    let originalError;
    api.apiClient.defaults.adapter = async (config) => {
      captured.push(config);
      entered.resolve(config);
      await release.promise;
      originalError = new axios.AxiosError("HTTP failure", "ERR_BAD_RESPONSE", config, undefined, {
        status, data, config, headers: new axios.AxiosHeaders(), statusText: "Failure",
      });
      throw originalError;
    };
    const request = api.apiClient.get("/protected-test");
    const rejected = assert.rejects(request, (error) => error === originalError);
    return { entered: entered.promise, release: release.resolve, rejected };
  }
  return { api, cookie, captured, cleanup, state, login, logouts, navigations, rejectWith };
}

test("the real API interceptor captures session epoch in memory without changing payload/headers", async () => {
  const f = fixture();
  const epoch = f.cookie.getBrowserAuthSessionEpoch();
  await f.api.apiClient.post("/protected-test", { message: "Olá" });
  const config = f.captured[0];
  assert.equal(config.headers.get("Authorization"), "Bearer session-A");
  assert.equal(f.api.getApiRequestSessionEpoch(config), epoch);
  assert.deepEqual(JSON.parse(config.data), { message: "Olá" });
  assert.equal(Object.keys(config.headers.toJSON()).some((name) => /epoch|generation/i.test(name)), false);
  assert.equal(f.api.getApiRequestSessionEpoch(undefined), undefined);
  assert.deepEqual(f.logouts, []);
  f.cleanup();
});

test("current 401 and 403 preserve the API message and route back to authentication", async () => {
  for (const status of [401, 403]) {
    const f = fixture();
    const pending = f.rejectWith(status, { message: `Acesso recusado ${status}.` });
    await pending.entered;
    pending.release();
    await pending.rejected;
    assert.deepEqual(f.logouts, [`Acesso recusado ${status}.`]);
    assert.deepEqual(f.navigations, ["/login"]);
    assert.equal(f.cookie.getBrowserAuthToken(), null);
    f.cleanup();
  }
});

test("a late 401/403 from account A cannot log account B out", async () => {
  for (const status of [401, 403]) {
    const f = fixture();
    const pending = f.rejectWith(status);
    const config = await pending.entered;
    f.login("session-B");
    assert.equal(config.headers.get("Authorization"), "Bearer session-A");
    pending.release();
    await pending.rejected;
    assert.equal(f.cookie.getBrowserAuthToken(), "session-B");
    assert.deepEqual(f.logouts, []);
    assert.deepEqual(f.navigations, []);
    f.cleanup();
  }
});

test("logout/login invalidates old requests even when the login reuses exactly the same token", async () => {
  for (const status of [401, 403]) {
    const f = fixture();
    const pending = f.rejectWith(status);
    const config = await pending.entered;
    const previousEpoch = f.api.getApiRequestSessionEpoch(config);
    f.state.logout("Saída explícita.");
    f.login();
    assert.equal(config.headers.get("Authorization"), `Bearer ${f.cookie.getBrowserAuthToken()}`);
    assert.notEqual(previousEpoch, f.cookie.getBrowserAuthSessionEpoch());
    pending.release();
    await pending.rejected;
    assert.deepEqual(f.logouts, ["Saída explícita."]);
    assert.deepEqual(f.navigations, []);
    assert.equal(f.state.isAuthenticated, true);
    f.cleanup();
  }
});

test("a current request after login with a reused token still expires correctly", async () => {
  const f = fixture();
  f.state.logout("Saída explícita.");
  f.login();
  const pending = f.rejectWith(401, { message: "Sessão atual expirada." });
  await pending.entered;
  pending.release();
  await pending.rejected;
  assert.deepEqual(f.logouts, ["Saída explícita.", "Sessão atual expirada."]);
  assert.deepEqual(f.navigations, ["/login"]);
  f.cleanup();
});

test("anonymous requests cannot invalidate an authenticated session created while they were pending", async () => {
  const f = fixture();
  f.state.logout("Saída explícita.");
  const pending = f.rejectWith(401);
  const config = await pending.entered;
  assert.equal(config.headers.get("Authorization"), undefined);
  f.login();
  pending.release();
  await pending.rejected;
  assert.deepEqual(f.logouts, ["Saída explícita."]);
  assert.deepEqual(f.navigations, []);
  f.cleanup();
});

test("500 responses and network failures reject without ending the session", async () => {
  const f = fixture();
  const pending = f.rejectWith(500);
  await pending.entered;
  pending.release();
  await pending.rejected;
  f.api.apiClient.defaults.adapter = async (config) => {
    throw new axios.AxiosError("Timeout", "ECONNABORTED", config);
  };
  await assert.rejects(f.api.apiClient.get("/protected-test"), { code: "ECONNABORTED" });
  assert.deepEqual(f.logouts, []);
  assert.deepEqual(f.navigations, []);
  f.cleanup();
});

test("cleanup ejects the real response interceptor and leaves errors rejected", async () => {
  const f = fixture();
  f.cleanup();
  const pending = f.rejectWith(401);
  await pending.entered;
  pending.release();
  await pending.rejected;
  assert.deepEqual(f.logouts, []);
  assert.deepEqual(f.navigations, []);
});
