---
scope: "<@monorepo/project-name, or a repo path>"
commit: "<the short sha the audit read>"
---

# 🔎 <What was audited>

## 🗺 Context

<What was read — every non-spec file under which directories — and what "confirmed" means in this
audit: checked against a built artifact, reproduced, or read only. Line numbers are as of `commit`.>

## 🐛 Bugs

| ID | Where | What goes wrong | Fix | Status |
| --- | --- | --- | --- | --- |
| B1 | <`path/to/file.ts:12`, with the symbol> | <The failure, concretely — inputs and the wrong result> | <The change> | open |

## ♻️ Duplication

| ID | Copies | Consolidate into | Status |
| --- | --- | --- | --- |
| D1 | <Every copy, with its path> | <The one place it should live> | open |

## 🧹 Quality

| ID | Where | Issue | Fix | Status |
| --- | --- | --- | --- | --- |
| Q1 | <path> | <Dead code, a loose type, a hard-coded value> | <The change> | open |

## 🪜 Order

<The sequence to work in, and why — which fix makes another free, which one would have caught the
rest.>
