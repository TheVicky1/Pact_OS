# 🪟 Contributing to PACT on Windows

This guide helps contributors on Windows fix the most common setup problems: line ending warnings, PowerShell vs. bash differences, and PowerShell execution policy errors.

If you are new to contributing, start with the [Beginner's Guide](CONTRIBUTING-BEGINNERS.md) first. For other problems, see [Troubleshooting](TROUBLESHOOTING.md#10-windows-powershell--os-tips).

---

## Table of Contents

1. [Git Line Endings (CRLF vs. LF)](#1-git-line-endings-crlf-vs-lf)
2. [Running npm Scripts in PowerShell vs. Bash](#2-running-npm-scripts-in-powershell-vs-bash)
3. [PowerShell Execution Policy Errors](#3-powershell-execution-policy-errors)
4. [Using WSL2 (Optional)](#4-using-wsl2-optional)
5. [Quick Checklist](#5-quick-checklist)

---

## 1. Git Line Endings (CRLF vs. LF)

Windows ends lines with CRLF, while macOS and Linux use LF. Git can convert between them, but a wrong setting causes noisy diffs.

**Symptoms**:

- Git warns: `LF will be replaced by CRLF the next time Git touches it`.
- Git shows every line of a file as modified, even though you changed nothing.

**Fix**:

Check your current setting:

```bash
git config --global core.autocrlf
```

On Windows, set it to `true`:

```bash
git config --global core.autocrlf true
```

> 💡 **Tip**: The warning itself is harmless. It only tells you that Git is converting line endings for you.

If a file is already showing as fully modified, discard the line ending changes and check the status again:

```bash
git checkout -- <file>
git status
```

---

## 2. Running npm Scripts in PowerShell vs. Bash

The scripts in `package.json` (`dev`, `build`, `lint`, `typecheck`, `test`) run the same way in PowerShell, Command Prompt, and Git Bash:

```bash
npm run dev
npm run lint
npm run typecheck
npm test
```

Differences only appear when you use shell commands around them:

| Task                         | Bash / Git Bash        | PowerShell                    |
| ---------------------------- | ---------------------- | ----------------------------- |
| Copy a file                  | `cp source dest`       | `Copy-Item source dest`       |
| Set an environment variable  | `export NAME=value`    | `$env:NAME = "value"`         |
| Print an environment variable | `echo $NAME`          | `echo $env:NAME`              |
| Chain commands               | `cmd1 && cmd2`         | `cmd1; cmd2`                  |

> 💡 **Tip**: If a command from the docs fails in PowerShell, try it in Git Bash, which is installed together with Git for Windows.

---

## 3. PowerShell Execution Policy Errors

**Symptoms**:

Running `npm` fails with an error like `File ... cannot be loaded because running scripts is disabled on this system`.

**Fix (current session only)**:

This is the safest option, and it resets when you close PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

**Fix (permanent, current user only)**:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Check the active policies at any time:

```powershell
Get-ExecutionPolicy -List
```

> ⚠️ **Note**: Avoid changing the policy for the whole machine unless you are an administrator and understand the security impact.

---

## 4. Using WSL2 (Optional)

WSL2 runs a real Linux environment on Windows, so every command in the docs works as written.

1. Install WSL2 and a Linux distribution by following the [Microsoft guide](https://learn.microsoft.com/windows/wsl/install).
2. Clone the repository **inside the Linux file system** (for example `~/Pact_OS`), not under `/mnt/c`. This is much faster.
3. Inside WSL, use `git config --global core.autocrlf input` so that files keep LF endings.

---

## 5. Quick Checklist

- [ ] `core.autocrlf` is set to `true` (or `input` in WSL2).
- [ ] PowerShell can run `npm` without execution policy errors.
- [ ] `npm run lint`, `npm run typecheck`, and `npm test` pass locally.