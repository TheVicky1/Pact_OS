# 🌱 Contributing to PACT — Beginner's Guide

Welcome! If you have never contributed to open source or submitted a pull request on GitHub before, **you are in the right place**. 

You do not need to be an expert to contribute to **PACT**. Whether you are fixing a typo in documentation, improving button styling, writing a test, or fixing a bug, your help is warmly welcomed.

This guide walks you through the entire process step by step, from creating your personal copy of the repository to opening your first Pull Request.

---

## Table of Contents

1. [Open Source Concepts in Plain English](#1-open-source-concepts-in-plain-english)
2. [Before You Start](#2-before-you-start)
3. [Choose Your First Contribution](#3-choose-your-first-contribution)
4. [Step 1: Fork the Repository](#step-1-fork-the-repository)
5. [Step 2: Install Required Software](#step-2-install-required-software)
6. [Step 3: Clone Your Fork to Your Computer](#step-3-clone-your-fork-to-your-computer)
7. [Step 4: Install Dependencies](#step-4-install-dependencies)
8. [Step 5: Set Up Environment Variables](#step-5-set-up-environment-variables)
9. [Step 6: Run PACT Locally](#step-6-run-pact-locally)
10. [Step 7: Quick Project Orientation](#step-7-quick-project-orientation)
11. [Step 8: Create a Topic Branch](#step-8-create-a-topic-branch)
12. [Step 9: Make Your Changes](#step-9-make-your-changes)
13. [Step 10: Test and Validate Your Changes](#step-10-test-and-validate-your-changes)
14. [Step 11: Commit Your Changes](#step-11-commit-your-changes)
15. [Step 12: Push to Your Fork](#step-12-push-to-your-fork)
16. [Step 13: Open Your Pull Request](#step-13-open-your-pull-request)
17. [Step 14: What Happens After You Submit?](#step-14-what-happens-after-you-submit)
18. [Common Beginner Mistakes to Avoid](#common-beginner-mistakes-to-avoid)
19. [First Contribution Checklist](#first-contribution-checklist)

---

## 1. Open Source Concepts in Plain English

If you are new to GitHub and Git, here are the core terms you will encounter:

- **Repository ("Repo")**: The project folder on GitHub containing all code, documentation, and history.
- **Issue**: A tracked task, feature idea, documentation request, or bug report.
- **Fork**: Your own personal copy of the PACT repository on your GitHub account where you can freely make changes.
- **Clone**: Downloading a copy of your forked repository from GitHub onto your local computer.
- **Branch**: An isolated workspace in Git where you make specific changes without affecting the main codebase.
- **Commit**: A saved snapshot or checkpoint of your changes with a short descriptive message.
- **Push**: Uploading your saved local commits from your computer up to your GitHub fork.
- **Pull Request (PR)**: A proposal sent to the PACT maintainers asking them to review and merge your changes into the main repository.
- **Maintainer**: The project developers who review contributions, answer questions, and merge pull requests.

---

## 2. Before You Start

1. **Check Existing Issues**: Visit the [GitHub Issues](https://github.com/TheVicky1/Pact_OS/issues) tab. Filter issues with the [`good first issue`](https://github.com/TheVicky1/Pact_OS/labels/good%20first%20issue) and `difficulty:beginner` labels (or browse our [**40 Curated Beginner Issues Catalog**](GITHUB_BEGINNER_ISSUES.md) and [**Label Taxonomy**](GITHUB_LABELS.md)).
2. **Avoid Duplicate Work**: Check if someone is already commenting on or assigned to an issue before starting.
3. **Claim an Issue**: Leave a short comment on the issue (e.g., *"I'd like to work on this issue. Please assign it to me."*). A maintainer will confirm your assignment.
4. **Ask Questions**: If any requirement is unclear, ask directly inside the issue. It is always better to clarify early than to rewrite code later.

---

## 3. Choose Your First Contribution (Micro-Contributions)

You do not have to write hundreds of lines of complex code or understand the entire architecture. PACT embraces a **micro-contribution model**: tasks are deliberately scoped to **one single file** and **one specific, high-leverage improvement** (typically 1–5 minutes of actual implementation).

Look for these beginner-friendly labels on GitHub:

- 📖 **Documentation** (`type:docs`): Fix typos, clarify setup instructions, or improve code comments.
- 🎨 **UI Polish** (`type:ui`): Refine button styling, add hover elevations, improve responsive padding.
- ♿ **Accessibility** (`type:a11y`): Add missing `aria-label` or `aria-expanded` attributes, improve keyboard focus indicators.
- 🐛 **Bug Fixes** (`type:bug`): Prevent empty input submissions, fix string pluralizations.
- 🧪 **Unit Tests** (`type:test`): Add single boundary or edge-case test cases to existing test suites.
- 🧹 **Developer Experience** (`type:refactor` / `type:tooling`): Add standard script aliases, clean unused imports.

> 💡 Every Good First Issue includes the **exact target file**, **step-by-step guidance**, **acceptance criteria**, and **local test command** so you can succeed on your very first try!

---

## Step 1: Fork the Repository

1. Open the official PACT repository: [https://github.com/TheVicky1/Pact_OS](https://github.com/TheVicky1/Pact_OS).
2. Look at the top-right corner of the page and click the **Fork** button.
3. In the dialog, select your GitHub username and click **Create fork**.
4. GitHub will create a copy under `https://github.com/<your-username>/Pact_OS`.

---

## Step 2: Install Required Software

Before running PACT on your computer, ensure you have the following installed:

1. **Node.js (LTS Version 20.x or 22.x)**:
   - Download from [nodejs.org](https://nodejs.org/).
   - Node.js includes `npm` (Node Package Manager).
2. **Git**:
   - Download from [git-scm.com](https://git-scm.com/).
3. **A Code Editor**:
   - We recommend [Visual Studio Code (VS Code)](https://code.visualstudio.com/).

### Verify Your Installation
Open your terminal (macOS/Linux) or PowerShell / Command Prompt (Windows) and run:

```bash
node --version
npm --version
git --version
```

If version numbers appear for all three, your environment is ready.

---

## Step 3: Clone Your Fork to Your Computer

### Option A: Using the Terminal (Recommended)

1. Open your terminal or PowerShell.
2. Clone your personal fork (replace `<your-username>` with your actual GitHub username):
   ```bash
   git clone https://github.com/<your-username>/Pact_OS.git
   cd Pact_OS
   ```
3. Connect your local repository to the original PACT repository (called `upstream`) so you can stay updated with new changes:
   ```bash
   git remote add upstream https://github.com/TheVicky1/Pact_OS.git
   ```

### Option B: Using GitHub Desktop
If you prefer a graphical interface:
1. Download and install [GitHub Desktop](https://desktop.github.com/).
2. Click **File → Clone Repository...**
3. Select your fork of `Pact_OS` and choose a local directory on your computer.

---

## Step 4: Install Dependencies

Inside your `Pact_OS` project directory in the terminal, run:

```bash
npm install
```

This command reads `package.json` and downloads all necessary libraries (such as Next.js, React, Tailwind CSS, and Lucide icons) into a local `node_modules` folder.

---

## Step 5: Set Up Environment Variables

PACT uses environment variables to configure URLs and keys. We provide a template file called `.env.example`.

1. Copy `.env.example` to create your private `.env.local` file:

   **macOS / Linux / Git Bash / PowerShell:**
   ```bash
   cp .env.example .env.local
   ```

   **Windows Command Prompt:**
   ```cmd
   copy .env.example .env.local
   ```

2. *Note for Beginners*: The template values in `.env.example` allow you to run the application UI, explore all views, and run the test suite locally right away without requiring a live Supabase database account.

> ⚠️ **Important**: `.env.local` is listed in `.gitignore`. **Never commit or share your `.env.local` file**, as it is meant to hold local secrets.

---

## Step 6: Run PACT Locally

Start the local development server:

```bash
npm run dev
```

In your terminal, you will see output similar to:
```
▲ Next.js 16.3.4
- Local: http://localhost:3000
✓ Ready in 1.5s
```

Open your web browser and navigate to [http://localhost:3000](http://localhost:3000) to view PACT running on your machine!

*(To stop the server at any time, press `Ctrl + C` in your terminal).*

---

## Step 7: Quick Project Orientation

Here is a simplified map of the PACT codebase to help you find where to make changes:

```
Pact_OS/
├── src/
│   ├── app/          # Web pages and routes (e.g., /app/planner, /app/tasks)
│   ├── components/   # Reusable UI elements (buttons, inputs, modal dialogs, cards)
│   ├── features/     # Feature-specific components (dashboard, calendar, habits, focus)
│   ├── lib/          # Business logic engines (accountability, money math, analytics)
│   └── types/        # TypeScript interfaces and data models
├── docs/             # Product and developer documentation
└── tests/            # Automated domain and security test suites
```

---

## Step 8: Create a Topic Branch

Never make changes directly on the `main` branch. Always create a new branch for your task:

```bash
# 1. Switch to main and pull latest changes from upstream
git checkout main
git pull upstream main

# 2. Create and switch to your new branch
git checkout -b <branch-name>
```

### Good Branch Name Examples:
- `docs/fix-setup-typo`
- `ui/adjust-card-padding`
- `fix/calendar-event-modal`
- `test/add-money-formatter-tests`

---

## Step 9: Make Your Changes

1. Open the project folder in VS Code (`code .`).
2. Make your edits carefully.
3. Keep your changes focused strictly on the issue you are solving. Avoid editing unrelated files or reformatting large sections of code.
4. **UI Design Reminder**: PACT uses a disciplined **Obsidian Black Canvas** (`#050505`), **Warm White** text (`#F5F5F5`), and **Restrained PACT Gold** (`#D4AF37`). Avoid introducing arbitrary neon colors.

---

## Step 10: Test and Validate Your Changes

Before submitting your work, run these validation checks locally to ensure everything works properly:

1. **Check Code Quality & Formatting**:
   ```bash
   npm run lint
   ```
2. **Check TypeScript Types**:
   ```bash
   npx tsc --noEmit
   ```
3. **Run the Test Suite**:
   ```bash
   node scratch/run-tests.mjs
   ```
4. **Run the Secret Scanner**:
   ```bash
   node scratch/secret-scan.mjs
   ```
5. **Verify Production Build**:
   ```bash
   npm run build
   ```

If any command reports an error, review the error message, resolve the issue in your code, and run the check again. For common fixes, see the [Troubleshooting Guide](TROUBLESHOOTING.md).

---

## Step 11: Commit Your Changes

Once your changes are tested and all checks pass, save them to Git:

1. View what files you modified:
   ```bash
   git status
   ```
2. Stage your changes:
   ```bash
   git add .
   ```
3. Save your commit with a clear, concise message:
   ```bash
   git commit -m "docs: clarify local setup prerequisites"
   ```

### Commit Message Format:
- `feat: add focus timer sound toggle`
- `fix: resolve task priority dropdown alignment`
- `docs: update troubleshooting guide for Windows users`
- `ui: polish active focus card shadow`
- `test: add unit test for grace period calculation`

---

## Step 12: Push to Your Fork

Upload your local commit to your GitHub fork:

```bash
git push -u origin <your-branch-name>
```

*(Replace `<your-branch-name>` with the name of the branch you created in Step 8).*

---

## Step 13: Open Your Pull Request

1. Go to your fork on GitHub (`https://github.com/<your-username>/Pact_OS`).
2. You will see a yellow banner: **"<your-branch-name> had recent pushes"** with a green **Compare & pull request** button. Click it.
3. Verify that the **base repository** is `TheVicky1/Pact_OS` and the **base branch** is `main`.
4. Fill in the title and description:
   - **Title**: A concise summary (e.g., `docs: clarify local environment setup for Windows`).
   - **Description**:
     - Explain **what** was changed.
     - Explain **why** the change was made.
     - Link the issue: `Fixes #12` or `Closes #34`.
     - Describe how you tested the change.
     - For UI changes, attach a before/after screenshot.
5. Click **Create pull request**.

🎉 **Congratulations! You have just submitted your Pull Request to PACT!**

---

## Step 14: What Happens After You Submit?

1. **Maintainer Review**: A maintainer will review your Pull Request, verify that tests pass, and review your code.
2. **Feedback & Iteration**: 
   - If changes are suggested, **do not worry!** Code review is a normal, collaborative part of software development.
   - Simply make the requested edits in your local branch, save, commit, and push again (`git push`). Your Pull Request on GitHub will update automatically!
3. **Approval & Merge**: Once approved, a maintainer will merge your Pull Request into `main`.
4. **Recognition**: Your contribution will be celebrated and recognized in [CONTRIBUTORS.md](../CONTRIBUTORS.md)!

---

## Common Beginner Mistakes to Avoid

| Mistake | Why to Avoid It | What to Do Instead |
| :--- | :--- | :--- |
| **Editing directly on `main`** | Makes it hard to sync with new updates from upstream. | Always create a topic branch (`git checkout -b fix/my-fix`). |
| **Committing `.env.local` or secrets** | Exposes private credentials or API keys. | Verify `.env.local` is in `.gitignore` and run `node scratch/secret-scan.mjs`. |
| **Mixing unrelated edits** | Large, unfocused PRs take longer to review and may conflict. | Keep each PR focused on a single issue or improvement. |
| **Ignoring lint/type errors** | Broken types prevent successful production builds. | Run `npm run lint` and `npx tsc --noEmit` before opening your PR. |
| **Forgetting to link the issue** | Maintainers have to manually search for context. | Add `Closes #<issue-number>` in your PR description. |

---

## First Contribution Checklist

Before submitting your PR, use this quick checklist:

- [ ] I have read this beginner guide and [CONTRIBUTING.md](../CONTRIBUTING.md).
- [ ] I created a dedicated topic branch from `main`.
- [ ] My changes are focused strictly on the assigned issue.
- [ ] For UI edits, I respected PACT's Obsidian Black & Gold design system.
- [ ] `npm run lint` passed with 0 errors.
- [ ] `npx tsc --noEmit` passed with 0 errors.
- [ ] `node scratch/run-tests.mjs` passed all test suites.
- [ ] `node scratch/secret-scan.mjs` confirmed 0 committed secrets.
- [ ] I pushed my branch and opened a Pull Request with a clear summary.

---

> 💡 **Need More Help?**  
> If you run into any errors during setup or development, check out our [Troubleshooting Guide](TROUBLESHOOTING.md) or visit [SUPPORT.md](../SUPPORT.md).
