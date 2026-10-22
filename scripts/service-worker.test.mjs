import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");

function createWorker({ storageFails = false, responseStatus = 200 } = {}) {
  const handlers = new Map();
  const entries = new Map();
  let requests = 0;
  const deleted = [];
  const cache = {
    match: async (request) => entries.get(request.url),
    put: async (request, response) => { entries.set(request.url, response); },
    keys: async () => [...entries.keys()].map((url) => ({ url })),
    delete: async (request) => entries.delete(request.url),
  };
  const response = { status: responseStatus, type: "basic", redirected: false, clone() { return { ...this }; } };
  vm.runInNewContext(source, {
    URL,
    self: {
      location: { origin: "https://app.example" },
      addEventListener: (type, handler) => handlers.set(type, handler),
      skipWaiting: async () => {},
      clients: { claim: async () => {} },
    },
    caches: {
      open: async () => { if (storageFails) throw Error("Storage unavailable"); return cache; },
      keys: async () => ["other-app", "app-financeiro-old", "app-financeiro-static-v1"],
      delete: async (name) => { deleted.push(name); },
    },
    fetch: async () => { requests++; return response; },
  });

  return {
    entries,
    deleted,
    get requests() { return requests; },
    async request(path, overrides = {}) {
      let result;
      const tasks = [];
      handlers.get("fetch")({
        request: { url: new URL(path, "https://app.example").href, method: "GET", mode: "cors", cache: "default", ...overrides },
        respondWith: (promise) => { result = promise; },
        waitUntil: (promise) => tasks.push(promise),
      });
      const response = await result;
      await Promise.all(tasks);
      return response;
    },
    async activate() {
      let work;
      handlers.get("activate")({ waitUntil: (promise) => { work = promise; } });
      await work;
    },
  };
}

test("reuses build assets on a second opening without another network request", async () => {
  const worker = createWorker();
  await worker.request("/_next/static/chunks/abc.js");
  await worker.request("/_next/static/chunks/abc.js");
  assert.equal(worker.requests, 1);
});

test("leaves navigation, private data, external resources and mutations to the browser", async () => {
  const worker = createWorker();
  for (const [path, options] of [
    ["/inicio", { mode: "navigate" }],
    ["/inicio?_rsc=test", {}],
    ["/api/private", {}],
    ["https://other.example/_next/static/chunk.js", {}],
    ["/_next/static/chunk.js", { method: "POST" }],
    ["/_next/static/chunk.js", { cache: "no-store" }],
  ]) assert.equal(await worker.request(path, options), undefined);
  assert.equal(worker.entries.size, 0);
  assert.equal(worker.requests, 0);
});

test("loads over the network if cache storage is unavailable", async () => {
  const worker = createWorker({ storageFails: true });
  assert.equal((await worker.request("/_next/static/a.js")).status, 200);
  assert.equal(worker.requests, 1);
});

test("never caches a failed build-asset response", async () => {
  const worker = createWorker({ responseStatus: 404 });
  await worker.request("/_next/static/missing.js");
  assert.equal(worker.entries.size, 0);
});

test("bounds cached files and keeps unrelated caches during activation", async () => {
  const worker = createWorker();
  for (let i = 0; i < 130; i++) await worker.request(`/_next/static/${i}.js`);
  assert.equal(worker.entries.size, 128);
  await worker.activate();
  assert.deepEqual(worker.deleted, ["app-financeiro-old"]);
});
