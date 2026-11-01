export const meta = {
    name: "ship-issue",
    description:
        "Take GitHub issues to merged PRs one at a time: plan, implement, check, review, fix, ship",
    whenToUse:
        "The user asks to ship, build or run one or more issue numbers unattended, e.g. /ship-issue 340 341",
    phases: [
        { title: "Pick", detail: "pnpm issue:pick and pnpm issue:brief" },
        { title: "Plan", detail: "ticket-planner maps the issue onto existing precedent" },
        { title: "Implement", detail: "code and specs, then pnpm check" },
        { title: "Review", detail: "architecture, tests and correctness reviewers, then fixes" },
        { title: "Polish", detail: "comment-cleanup and doc-drift-check" },
        { title: "Ship", detail: "commit, then pnpm issue:ship" },
    ],
};

const MAX_CHECK_FIXES = 2;
const MAX_REVIEW_ROUNDS = 2;
const REVIEWERS = ["review-architecture", "review-tests", "review-correctness"];

const NO_GIT =
    "Never run git commands that change state (add, commit, checkout, stash, reset, push) and never " +
    "run gh commands that write: the workflow's ship step owns those.";

const CHECK =
    "Run `pnpm check` alone, with the Bash timeout at 600000 ms, and nothing else heavy beside it. " +
    "If it fails, fix what it reports and run it again.";

const PICK_SCHEMA = {
    type: "object",
    properties: {
        ok: { type: "boolean" },
        branch: { type: "string" },
        brief: { type: "string", description: "pnpm issue:brief output, verbatim" },
        error: { type: "string" },
    },
    required: ["ok"],
};

const PLAN_SCHEMA = {
    type: "object",
    properties: {
        status: { enum: ["ready", "needs-decision"] },
        decision: {
            type: "string",
            description: "What must be decided and by whom, when needs-decision",
        },
        precedents: {
            type: "array",
            items: {
                type: "object",
                properties: { path: { type: "string" }, copies: { type: "string" } },
                required: ["path", "copies"],
            },
        },
        changes: { type: "array", items: { type: "string" } },
        tests: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    criterion: { type: "string" },
                    spec: { type: "string" },
                    title: { type: "string" },
                },
                required: ["criterion", "spec", "title"],
            },
        },
        docs: { type: "array", items: { type: "string" } },
        order: { type: "array", items: { type: "string" } },
    },
    required: ["status"],
};

const CHECKED_SCHEMA = {
    type: "object",
    properties: {
        checkPassed: { type: "boolean" },
        failures: { type: "string", description: "What pnpm check still reports, when it failed" },
        touched: {
            type: "array",
            items: { type: "string" },
            description: "Every repo-relative path this step created, modified or deleted",
        },
        summary: { type: "string" },
    },
    required: ["checkPassed", "touched"],
};

const FINDINGS_SCHEMA = {
    type: "object",
    properties: {
        findings: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    severity: { enum: ["blocking", "advisory"] },
                    file: { type: "string" },
                    line: { type: "number" },
                    summary: { type: "string" },
                    fix: { type: "string" },
                },
                required: ["severity", "file", "summary"],
            },
        },
    },
    required: ["findings"],
};

const SHIP_SCHEMA = {
    type: "object",
    properties: {
        pr: { type: "string" },
        checksPassed: { type: "boolean" },
        merged: { type: "boolean" },
        output: { type: "string", description: "The last lines pnpm issue:ship printed" },
        blocked: {
            type: "string",
            description: "Changes outside this run's paths that stopped the commit, if any",
        },
    },
    required: ["checksPassed", "merged"],
};

const issueNumbers = () => {
    const raw = typeof args === "string" ? args.split(/[\s,]+/) : (args?.issues ?? args);
    return [raw]
        .flat()
        .map((n) => Number(String(n).replace("#", "")))
        .filter((n) => Number.isInteger(n) && n > 0);
};

const formatFinding = (f) => {
    const where = f.line ? `${f.file}:${f.line}` : f.file;
    return `- [${f.severity}] ${where}: ${f.summary}${f.fix ? ` Fix: ${f.fix}` : ""}`;
};

const formatFindings = (findings) => findings.map(formatFinding).join("\n");

const halt = async (issue, stage, reason) => {
    await agent(
        `Issue #${issue} stopped at the "${stage}" stage of the ship-issue workflow and needs a human.\n\n` +
            `Reason:\n${reason}\n\n` +
            `Run \`gh issue edit ${issue} --add-label needs-human\` and \`gh issue comment ${issue}\` with a ` +
            `short comment saying which stage stopped and why. If \`gh pr view --json url\` finds a PR for ` +
            `the current branch, label and comment on that PR the same way instead of the issue. Change no ` +
            `files and make no commits.`,
        { label: `halt #${issue}`, phase: "Ship", effort: "low" },
    );
    return { issue, halted: true, stage, reason };
};

const checkUntilGreen = (issue, task, label, phaseName) =>
    agent(
        `${task}\n\nWhen you're done, ${CHECK} Stop after ${MAX_CHECK_FIXES} failed fix attempts and report ` +
            `checkPassed=false with what still fails. List every path you created, modified or deleted ` +
            `in touched. ${NO_GIT}`,
        { label: `${label} #${issue}`, phase: phaseName, schema: CHECKED_SCHEMA },
    );

const shipOne = async (issue) => {
    phase("Pick");
    const pick = await agent(
        `Start issue #${issue}. First \`git status --porcelain\` must print nothing; if it doesn't, stop ` +
            `and report ok=false with what's dirty. Then run \`git fetch origin master\` and ` +
            `\`pnpm issue:pick ${issue}\`, passing a short ` +
            `\`--title="…"\` if the issue title would make a long branch slug, then \`pnpm issue:brief\`. ` +
            `Return the branch name and the brief verbatim. If either command fails, report ok=false with ` +
            `its output. Change no files.`,
        { label: `pick #${issue}`, phase: "Pick", schema: PICK_SCHEMA, effort: "low" },
    );
    if (!pick?.ok) return halt(issue, "Pick", pick?.error ?? "The pick agent returned nothing.");

    phase("Plan");
    const plan = await agent(`Plan issue #${issue}. Its brief:\n\n${pick.brief}`, {
        label: `plan #${issue}`,
        phase: "Plan",
        agentType: "ticket-planner",
        schema: PLAN_SCHEMA,
    });
    if (!plan) return halt(issue, "Plan", "The planner returned nothing.");
    if (plan.status === "needs-decision") {
        return halt(issue, "Plan", plan.decision ?? "needs-decision");
    }

    const touched = new Set();
    const track = (step) => (step?.touched ?? []).forEach((path) => touched.add(path));

    phase("Implement");
    const built = await checkUntilGreen(
        issue,
        `Implement issue #${issue} on the current branch, following the plan exactly. Copy each ` +
            `precedent it names; don't introduce structure it doesn't name. Write every spec it lists, ` +
            `using the \`writing-tests\` skill, and update every doc it lists. If the plan turns out to be ` +
            `wrong, report checkPassed=false and explain rather than improvising a different design.\n\n` +
            `Brief:\n${pick.brief}\n\nPlan:\n${JSON.stringify(plan, null, 2)}`,
        "implement",
        "Implement",
    );
    track(built);
    if (!built?.checkPassed) {
        return halt(issue, "Implement", built?.failures ?? "pnpm check never went green.");
    }

    const reviewContext =
        `Review the work on the current branch for issue #${issue}, compared with origin/master.\n\n` +
        `Brief:\n${pick.brief}\n\nPrecedents the planner named:\n${JSON.stringify(plan.precedents ?? [], null, 2)}`;

    let reviewers = REVIEWERS;
    let advisory = [];
    const fixed = [];
    for (let round = 1; ; round++) {
        phase("Review");
        const results = await parallel(
            reviewers.map(
                (type) => () =>
                    agent(reviewContext, {
                        label: `${type} #${issue} r${round}`,
                        phase: "Review",
                        agentType: type,
                        schema: FINDINGS_SCHEMA,
                    }).then((r) => (r ? { type, findings: r.findings } : null)),
            ),
        );
        const answered = results.filter(Boolean);
        if (answered.length < reviewers.length) {
            return halt(issue, "Review", "A reviewer returned nothing.");
        }

        const all = answered.flatMap((r) => r.findings.map((f) => ({ ...f, reviewer: r.type })));
        advisory = advisory.concat(all.filter((f) => f.severity === "advisory"));
        const blocking = all.filter((f) => f.severity === "blocking");
        if (!blocking.length) break;

        if (round > MAX_REVIEW_ROUNDS) {
            const reason = `Still blocking after ${MAX_REVIEW_ROUNDS} fix rounds:\n`;
            return halt(issue, "Review", reason + formatFindings(blocking));
        }

        log(`#${issue} round ${round}: ${blocking.length} blocking finding(s)`);
        const fix = await checkUntilGreen(
            issue,
            `Fix these blocking review findings for issue #${issue}, and only these. If a finding is ` +
                `wrong, leave the code alone and say why in the summary.\n\n${formatFindings(blocking)}`,
            `fix r${round}`,
            "Review",
        );
        track(fix);
        if (!fix?.checkPassed) {
            return halt(
                issue,
                "Review",
                fix?.failures ?? "pnpm check never went green after fixes.",
            );
        }

        fixed.push(...blocking);
        reviewers = [...new Set(blocking.map((f) => f.reviewer))];
    }

    phase("Polish");
    const polished = await checkUntilGreen(
        issue,
        `Run the \`comment-cleanup\` skill over every file this run touched:\n${[...touched].join("\n")}\n` +
            `Then run the ` +
            `\`doc-drift-check\` skill for each project whose public surface changed, and apply what they ` +
            `find. Only run pnpm check if either of them changed a file; otherwise report checkPassed=true.`,
        "polish",
        "Polish",
    );
    track(polished);
    if (!polished?.checkPassed) {
        return halt(issue, "Polish", polished?.failures ?? "pnpm check failed after polish.");
    }

    phase("Ship");
    const reviewNote =
        `Review summary for the PR comment:\n` +
        `Fixed (${fixed.length}):\n${formatFindings(fixed) || "- none"}\n` +
        `Advisory, left as is (${advisory.length}):\n${formatFindings(advisory) || "- none"}`;
    const shipPrompt = (extra, comment) =>
        `The user ran the ship-issue workflow on issue #${issue}: that run is their explicit request to ` +
        `commit, push, open a PR and merge it. ${extra}Stage only this run's paths, with ` +
        `\`git add -- <path>\`, plus any file you change yourself in this step:\n${[...touched].join("\n")}\n` +
        `If \`git status --porcelain\` then shows any other change, another session is working in this ` +
        `checkout: commit nothing, leave those changes exactly as they are, and report them in blocked. ` +
        `Otherwise commit as Conventional Commits, split by concern, lower-case type and subject (the ` +
        `commit-msg hook adds the issue tag). ` +
        `Then run \`pnpm issue:ship\` with the Bash timeout at 600000 ms; it pushes, opens or reuses the ` +
        `PR, arms auto-merge and waits for the checks. If the timeout cuts it off, run it again: a re-run ` +
        `reuses the PR. If it ends with "merge queued", poll \`gh pr view --json state\` for up to five ` +
        `minutes, and once the state is MERGED run \`git checkout master && git pull --ff-only\`. ` +
        (comment
            ? `Once a PR exists, post this with \`gh pr comment\`, exactly once:\n\n${comment}`
            : "The review summary is already on the PR; don't post it again.");

    const foreign = (step) =>
        halt(issue, "Ship", `Changes this run didn't make are in the checkout:\n${step.blocked}`);

    let shipped = await agent(shipPrompt("", reviewNote), {
        label: `ship #${issue}`,
        phase: "Ship",
        schema: SHIP_SCHEMA,
    });
    if (shipped?.blocked) return foreign(shipped);
    if (shipped && !shipped.checksPassed) {
        log(`#${issue}: a check failed, one repair attempt`);
        shipped = await agent(
            shipPrompt(
                "A required check failed on the PR. Run `pnpm ci:failures`, fix what it reports, run " +
                    "`pnpm check` alone with the Bash timeout at 600000 ms until it's green, and then: ",
            ),
            { label: `ci-fix #${issue}`, phase: "Ship", schema: SHIP_SCHEMA },
        );
        if (shipped?.blocked) return foreign(shipped);
    }
    if (!shipped?.checksPassed) {
        return halt(issue, "Ship", shipped?.output ?? "No green checks after one repair attempt.");
    }
    if (!shipped.merged) {
        return halt(issue, "Ship", `Checks passed but the PR never merged: ${shipped.pr ?? ""}`);
    }

    return { issue, halted: false, pr: shipped.pr, fixed: fixed.length, advisory: advisory.length };
};

const issues = issueNumbers();
if (!issues.length) {
    throw new Error("Pass issue numbers, e.g. args: [340, 341] or { issues: [340] }.");
}

const results = [];
for (const issue of issues) {
    const result = await shipOne(issue);
    results.push(result);
    if (result.halted) {
        log(`Stopped at #${issue}; ${issues.length - results.length} issue(s) not started.`);
        break;
    }
}
return { results, notStarted: issues.slice(results.length) };
