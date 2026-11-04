import assert from "node:assert/strict";
import test from "node:test";

import { getGitBranchPolicyError } from "./git-guardrails.mjs";

test("Git policy permits work only on main", () => {
  assert.equal(getGitBranchPolicyError("main", "main"), null);

  for (const branch of ["develop", "codex/profile-fix", "temporary", "Main"]) {
    const error = getGitBranchPolicyError(branch, "main");
    assert.equal(typeof error, "string");
    assert.ok(error.includes(branch));
    assert.match(error, /Preserve o estado e informe o usuário/);
  }
});

test("Git policy refuses detached HEAD and unavailable branch information", () => {
  assert.match(getGitBranchPolicyError("", "main"), /HEAD destacado/);

  for (const branch of [undefined, null, "indisponível"]) {
    assert.match(getGitBranchPolicyError(branch, "main"), /Git indisponível/);
  }
});

test("Git policy cannot be disabled by missing or changed configuration", () => {
  for (const required of [undefined, null, false, "", "develop", "codex/work"]) {
    assert.match(getGitBranchPolicyError("main", required), /requiredBranch deve exigir main/);
  }
});
