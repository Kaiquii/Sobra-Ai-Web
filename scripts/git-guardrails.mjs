/** Read-only policy decision; callers obtain the current branch without changing Git. */
export function getGitBranchPolicyError(actualBranch, requiredBranch) {
  if (requiredBranch !== "main") {
    return "A proteção Git requiredBranch deve exigir main. Preserve o estado e informe o usuário; não desabilite a política para continuar.";
  }

  if (actualBranch === requiredBranch) {
    return null;
  }

  const current =
    actualBranch === ""
      ? "HEAD destacado"
      : typeof actualBranch !== "string" || actualBranch === "indisponível"
        ? "Git indisponível"
        : `branch ${actualBranch}`;

  return `Trabalho permitido somente na main; estado atual: ${current}. Preserve o estado e informe o usuário. Não crie branches/worktrees nem execute checkout, switch, reset, stash ou exclusões automáticas. Commit e push continuam dependendo de autorização.`;
}
