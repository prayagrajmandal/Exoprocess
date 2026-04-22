const { spawn } = require("node:child_process")
const path = require("node:path")

const root = process.cwd()
const isWindows = process.platform === "win32"
const pythonCmd = process.env.PYTHON || (isWindows ? "python" : "python3")
const npmCmd = isWindows ? "npm.cmd" : "npm"

function run(name, cwd, args) {
  const child = spawn(args[0], args.slice(1), {
    cwd,
    env: {
      ...process.env,
      PATH: [path.join(root, "scripts"), process.env.PATH].filter(Boolean).join(path.delimiter),
    },
    stdio: "inherit",
    shell: false,
  })

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`)
      process.exitCode = code
    }
  })

  return child
}

const backend = run("backend", root, [
  pythonCmd,
  "-m",
  "uvicorn",
  "main:app",
  "--app-dir",
  "backend",
  "--host",
  "0.0.0.0",
  "--port",
  "8001",
  "--reload",
  "--reload-dir",
  "backend",
])
const frontend = run("frontend", path.join(root, "frontend"), [npmCmd, "run", "dev"])

function shutdown() {
  backend.kill()
  frontend.kill()
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
