const { spawnSync } = require("node:child_process")
const fs = require("node:fs")
const path = require("node:path")

const root = process.cwd()
const isWindows = process.platform === "win32"
const npmCmd = isWindows ? "npm.cmd" : "npm"

function commandExists(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "ignore",
    shell: false,
  })

  return !result.error && result.status === 0
}

function resolvePythonCommand() {
  if (process.env.PYTHON) {
    return process.env.PYTHON
  }

  const candidates = isWindows ? [["python", ["--version"]]] : [["python3", ["--version"]], ["python", ["--version"]]]
  for (const [command, args] of candidates) {
    if (commandExists(command, args)) {
      return command
    }
  }

  return null
}

function ensureFrontendDependencies() {
  const nextBinary = isWindows
    ? path.join(root, "frontend", "node_modules", ".bin", "next.cmd")
    : path.join(root, "frontend", "node_modules", ".bin", "next")

  if (fs.existsSync(nextBinary)) {
    return
  }

  const installResult = spawnSync(
    npmCmd,
    ["install", "--include=dev", "--no-fund", "--no-audit"],
    {
      cwd: path.join(root, "frontend"),
      env: {
        ...process.env,
        PATH: [path.join(root, "scripts"), process.env.PATH].filter(Boolean).join(path.delimiter),
      },
      stdio: "inherit",
      shell: false,
    }
  )

  if (installResult.status !== 0) {
    process.exit(installResult.status || 1)
  }
}

const pythonCmd = resolvePythonCommand()

if (pythonCmd) {
  const backendResult = spawnSync(pythonCmd, ["-m", "py_compile", path.join("backend", "main.py")], {
    cwd: root,
    env: {
      ...process.env,
      PYTHONPYCACHEPREFIX: process.env.PYTHONPYCACHEPREFIX || "/tmp",
      PATH: [path.join(root, "scripts"), process.env.PATH].filter(Boolean).join(path.delimiter),
    },
    stdio: "inherit",
    shell: false,
  })

  if (backendResult.status !== 0) {
    process.exit(backendResult.status || 1)
  }
} else {
  console.warn("Skipping backend compile: Python is not available in this build environment.")
}

ensureFrontendDependencies()

const frontendResult = spawnSync(npmCmd, ["run", "build"], {
  cwd: path.join(root, "frontend"),
  env: {
    ...process.env,
    PATH: [path.join(root, "scripts"), process.env.PATH].filter(Boolean).join(path.delimiter),
  },
  stdio: "inherit",
  shell: false,
})

if (frontendResult.status !== 0) {
  process.exit(frontendResult.status || 1)
}
