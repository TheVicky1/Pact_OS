# 🏛️ PACT Pull Request

> 💡 **Submitting a Micro-Contribution / Good First Issue?**
> If you are working on a single-file micro-task (Good First Issue), you only need to fill out **Sections 1, 2, and 5** (and check the Micro-Contribution Fast-Path in Section 9). You can skip or leave optional sections blank!

---

## 1. Related Issue

<!-- Link the relevant issue below (e.g., Closes #12, Fixes #24, or Related to #34) -->
Closes #

---

## 2. Summary of Changes

<!-- Provide a concise summary of what this pull request modifies or adds -->

---

## 3. Motivation & Context (Optional for Micro-PRs)

<!-- Why is this change necessary? What problem does it solve or what value does it add? -->

---

## 4. Implementation Details (Optional for Micro-PRs)

<!-- Briefly describe the technical approach or key files modified -->

---

## 5. Testing & Local Validation

<!-- Check only the tests and verification commands that were actually executed locally -->
- [ ] `npm run lint` — ESLint passed with 0 errors
- [ ] `npx tsc --noEmit` — TypeScript strict check passed with 0 errors
- [ ] `node scratch/run-tests.mjs` — 41-suite domain test matrix passed
- [ ] `node scratch/secret-scan.mjs` — Zero secrets or sensitive credentials detected
- [ ] `npm run build` — Production build succeeded without errors

*If this is a documentation-only or micro PR, specify which verification was performed:*
> 

---

## 6. UI & Visual Changes (Optional)

<!-- If your changes affect the user interface, please complete this section -->
- [ ] **No UI changes** (This PR does not alter visual styling, layout, or components)
- [ ] **UI modifications included**:
  - [ ] Tested responsive scaling on mobile (`375px`), tablet (`768px`), and desktop (`1280px+`)
  - [ ] Adhered to the luxury Obsidian & Gold palette (`docs/DESIGN_SYSTEM.md`)
  - [ ] Verified visible focus states and contrast ratios (WCAG AA)

| Before | After |
| :---: | :---: |
| *(attach before screenshot/recording)* | *(attach after screenshot/recording)* |

---

## 7. Database & Security Impact (Optional)

- [ ] **No database or security-sensitive changes**
- [ ] **Database modifications included**:
  - [ ] Sequential migration added in `supabase/migrations/`
  - [ ] Row Level Security (RLS) policies verified with `auth.uid()`
  - [ ] No destructive schema changes on active columns
- [ ] **Security modifications included**:
  - [ ] Server Action input validated with Zod
  - [ ] User identity verified with `supabase.auth.getUser()`

---

## 8. Documentation Impact (Optional)

- [ ] Documentation updated to reflect changes (e.g., in `docs/` or `README.md`)
- [ ] Documentation updates not required for this change

---

## 9. Contributor Quality Checklist

Please verify the following before requesting a maintainer review:

- [ ] **🌱 Micro-Contribution Fast-Path**: This is a targeted Good First Issue / 5–30 minute micro-change (single file, verified locally).
- [ ] My PR has a single, focused scope (avoiding unrelated formatting or refactoring).
- [ ] I have read and followed PACT's [**Contributing Guide**](https://github.com/TheVicky1/Pact_OS/blob/main/CONTRIBUTING.md).
- [ ] I confirm that **zero secrets, API keys, private tokens, or `.env.local` files** are included in this PR.
- [ ] My branch was created from the latest `upstream/main` with an appropriate prefix (e.g., `feat/`, `fix/`, `docs/`, `ui/`).
- [ ] My commits follow the **Conventional Commits** format (`type(scope): description`).
- [ ] I have linked the target issue in Section 1 above.
- [ ] I have reviewed my own `git diff` to ensure no stray files or debugging artifacts were committed.

---

## 10. Reviewer Notes (Optional)

<!-- Add any extra context, performance notes, or questions for maintainers -->
