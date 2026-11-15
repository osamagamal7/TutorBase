#!/usr/bin/env node
// Turns the tickets in docs/tasks/phase-*.md into GitHub issues using the GitHub CLI (`gh`).
//
// Dry run (default, changes nothing):  node scripts/create-issues.mjs
// Create issues:                       node scripts/create-issues.mjs --create --a <github-user-A> --b <github-user-B> [--project "Tutorbase"]
//
// Run it from inside your clone of the project repo, after `gh auth login`.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tasksDir = join(root, "docs", "tasks");

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const create = args.includes("--create");
const owners = { A: flag("a"), B: flag("b") };
const project = flag("project");

const AREA_BY_PHASE = { 0: "infra", 1: "frontend", 2: "backend", 3: "infra", 4: "ai" };

function parseFile(file) {
  const phase = Number(file.match(/phase-(\d)/)[1]);
  const text = readFileSync(join(tasksDir, file), "utf8");
  const parts = text.split(/^### /m).slice(1);
  return parts.map((part) => {
    const [heading, ...rest] = part.split("\n");
    const [, id, title] = heading.match(/^(TB-\d+) · (.+)$/) ?? [];
    if (!id) throw new Error(`Unexpected heading in ${file}: ${heading}`);
    const body = rest.join("\n").replace(/\n---\s*$/s, "").trim();
    const meta = body.split("\n")[0];
    const owner = meta.match(/Owner: (A|B|Pair)/)?.[1] ?? "Pair";
    const size = meta.match(/Size: (S|M|L)/)?.[1];
    const weeks = meta.match(/Weeks?: ([\d–-]+)/)?.[1];
    return { id, title, body, phase, owner, size, weeks };
  });
}

const files = readdirSync(tasksDir)
  .filter((f) => /^phase-\d.*\.md$/.test(f))
  .sort();
const tickets = files.flatMap(parseFile);

const labelsFor = (t) =>
  [`phase-${t.phase}`, AREA_BY_PHASE[t.phase], t.size && `size-${t.size}`].filter(Boolean);

const assigneesFor = (t) =>
  (t.owner === "Pair" ? [owners.A, owners.B] : [owners[t.owner]]).filter(Boolean);

if (!create) {
  for (const t of tickets) {
    console.log(
      `${t.id}  week ${t.weeks ?? "?"}  ${t.owner.padEnd(4)}  ${(t.size ?? "-").padEnd(1)}  ${t.title}  [${labelsFor(t).join(", ")}]`,
    );
  }
  console.log(`\n${tickets.length} tickets parsed. Nothing was created. Re-run with --create to create issues.`);
  process.exit(0);
}

// The Tutorbase project auto-adds new repo issues. `gh issue create --project` then
// tries to add the same issue again and exits with "Content already exists in this project"
// even though the issue was created. Treat that as success, and skip titles that already exist
// so a re-run does not open duplicates.
const gh = (args, { projectDuplicateOk = false } = {}) => {
  try {
    return execFileSync("gh", args, { encoding: "utf8" });
  } catch (error) {
    const stderr = `${error.stderr ?? ""}`;
    const stdout = `${error.stdout ?? ""}`;
    if (projectDuplicateOk && stderr.includes("Content already exists in this project")) {
      return stdout;
    }
    if (stderr) process.stderr.write(stderr.endsWith("\n") ? stderr : `${stderr}\n`);
    throw error;
  }
};

const allLabels = new Set(tickets.flatMap(labelsFor));
for (const label of allLabels) gh(["label", "create", label, "--force"]);

const existing = new Map(
  JSON.parse(gh(["issue", "list", "--state", "all", "--limit", "200", "--json", "title,url"])).map(
    (issue) => [issue.title, issue.url],
  ),
);

for (const t of tickets) {
  const title = `${t.id} · ${t.title}`;
  if (existing.has(title)) {
    console.log(`${t.id} → ${existing.get(title)} (already exists)`);
    continue;
  }
  const ghArgs = ["issue", "create", "--title", title, "--body", t.body];
  for (const label of labelsFor(t)) ghArgs.push("--label", label);
  for (const user of assigneesFor(t)) ghArgs.push("--assignee", user);
  if (project) ghArgs.push("--project", project);
  const url = gh(ghArgs, { projectDuplicateOk: Boolean(project) }).trim();
  console.log(`${t.id} → ${url}`);
}
