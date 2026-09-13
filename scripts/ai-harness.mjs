import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const projectRoot = process.cwd();
const configPath = resolve(projectRoot, "ai-harness.config.json");

function fail(message) {
  console.error(`[ai-harness] ${message}`);
  process.exitCode = 1;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true,
  });

  return result.status === 0 ? result.stdout.trim() : "indisponível";
}

function listFiles(directory, ignoredDirectories, output = []) {
  if (!existsSync(directory)) {
    return output;
  }

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const entryPath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      listFiles(entryPath, ignoredDirectories, output);
    } else if (entry.isFile()) {
      output.push(relative(projectRoot, entryPath).replaceAll("\\", "/"));
    }
  }

  return output;
}

function getTrackedFiles() {
  const output = runGit(["ls-files", "-z"]);

  if (!output || output === "indisponível") {
    return [];
  }

  return output.split("\0").filter(Boolean);
}

function loadHarness() {
  if (!existsSync(configPath)) {
    throw new Error("ai-harness.config.json não foi encontrado.");
  }

  return readJson(configPath);
}

function doctor(config) {
  const errors = [];
  const packagePath = resolve(projectRoot, "package.json");

  for (const file of config.context.requiredFiles) {
    if (!existsSync(resolve(projectRoot, file))) {
      errors.push(`Arquivo de contexto ausente: ${file}`);
    }
  }

  for (const directory of config.context.sourceRoots) {
    const path = resolve(projectRoot, directory);

    if (!existsSync(path) || !statSync(path).isDirectory()) {
      errors.push(`Raiz de código ausente: ${directory}`);
    }
  }

  if (!existsSync(packagePath)) {
    errors.push("package.json não foi encontrado.");
  } else {
    const packageJson = readJson(packagePath);
    const expectedScripts = ["ai:context", "ai:doctor", "ai:check", "ai:check:quick"];

    for (const script of expectedScripts) {
      if (!packageJson.scripts?.[script]) {
        errors.push(`Script obrigatório ausente: ${script}`);
      }
    }
  }

  const trackedFiles = getTrackedFiles();
  const trackedProtectedFiles = trackedFiles.filter((file) => {
    const fileName = file.split("/").at(-1);

    return (
      config.guardrails.protectedFiles.includes(file) ||
      (fileName?.startsWith(".env") && fileName !== config.guardrails.allowEnvironmentTemplate)
    );
  });

  if (trackedProtectedFiles.length > 0) {
    errors.push(`Arquivo de ambiente protegido versionado: ${trackedProtectedFiles.join(", ")}`);
  }

  if (config.guardrails.forbidApiRoutesInMarkdown) {
    const routePattern = /\b(?:GET|POST|PUT|PATCH|DELETE)\s+\/api\//i;
    const ignoredDirectories = new Set(config.context.ignoredDirectories);
    const markdownFiles = listFiles(projectRoot, ignoredDirectories).filter((file) =>
      file.endsWith(".md"),
    );

    for (const file of markdownFiles) {
      const contents = readFileSync(resolve(projectRoot, file), "utf8");

      if (routePattern.test(contents)) {
        errors.push(`Detalhe operacional de API encontrado em Markdown: ${file}`);
      }
    }
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[ai-harness] ERRO: ${error}`);
    }

    process.exitCode = 1;
    return false;
  }

  console.log("[ai-harness] Configuração, contexto e proteções estão válidos.");
  return true;
}

function context(config) {
  const ignoredDirectories = new Set(config.context.ignoredDirectories);
  const sourceFiles = config.context.sourceRoots
    .flatMap((root) => listFiles(resolve(projectRoot, root), ignoredDirectories))
    .sort()
    .slice(0, config.context.maxSourceFiles);
  const packageJson = readJson(resolve(projectRoot, "package.json"));

  const snapshot = {
    harness: {
      schemaVersion: config.schemaVersion,
      generatedAt: new Date().toISOString(),
    },
    project: config.project,
    repository: {
      branch: runGit(["branch", "--show-current"]),
      changedFiles: runGit(["status", "--short"]),
    },
    runtime: {
      node: process.version,
      scripts: packageJson.scripts,
    },
    requiredContext: config.context.requiredFiles.map((file) => ({
      file,
      contents: readFileSync(resolve(projectRoot, file), "utf8").trim(),
    })),
    sourceFiles,
    guardrails: config.guardrails,
  };

  console.log(JSON.stringify(snapshot, null, 2));
}

function check(config, quick) {
  if (!doctor(config)) {
    return;
  }

  const npmCli = process.env.npm_execpath;
  const npmCommand = npmCli ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
  const checks = quick ? config.checks.quick : config.checks.full;

  for (const script of checks) {
    console.log(`[ai-harness] Executando npm run ${script}...`);
    const npmArguments = npmCli ? [npmCli, "run", script] : ["run", script];
    const result = spawnSync(npmCommand, npmArguments, {
      cwd: projectRoot,
      stdio: "inherit",
      windowsHide: true,
    });

    if (result.status !== 0) {
      if (result.error) {
        console.error(`[ai-harness] ${result.error.message}`);
      }

      fail(`A verificação ${script} falhou.`);
      return;
    }
  }

  console.log(`[ai-harness] ${quick ? "Verificação rápida" : "Verificação completa"} concluída.`);
}

try {
  const config = loadHarness();
  const command = process.argv[2] ?? "context";

  if (command === "context") {
    context(config);
  } else if (command === "doctor") {
    doctor(config);
  } else if (command === "check") {
    check(config, process.argv.includes("--quick"));
  } else {
    fail(`Comando desconhecido: ${command}`);
  }
} catch (error) {
  fail(error instanceof Error ? error.message : "Falha inesperada.");
}
