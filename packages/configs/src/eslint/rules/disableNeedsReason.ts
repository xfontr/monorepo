import type { AST as ESLintAST, Rule } from "eslint";
import type { AST } from "vue-eslint-parser";

interface Comment {
    value: string;
    loc: ESLintAST.SourceLocation;
}

interface Directive {
    kind: string;
    rules: string[];
    reason: string;
    loc: ESLintAST.SourceLocation;
}

const DIRECTIVE = /^\s*eslint-(disable-next-line|disable-line|disable|enable)(?=\s|$)/;

// ESLint itself splits a directive's description off at whitespace, two or more dashes, whitespace.
const DESCRIPTION = /\s-{2,}\s/;

const parse = ({ value, loc }: Comment): Directive | undefined => {
    const match = DIRECTIVE.exec(value);
    if (!match?.[1]) return undefined;
    const [list = "", ...reason] = ` ${value.slice(match[0].length)} `.split(DESCRIPTION);
    return {
        kind: match[1],
        rules: list
            .split(",")
            .map((rule) => rule.trim())
            .filter(Boolean),
        reason: reason.join(" ").trim(),
        loc,
    };
};

const isAfter = (a: ESLintAST.SourceLocation, b: ESLintAST.SourceLocation): boolean =>
    a.start.line > b.start.line ||
    (a.start.line === b.start.line && a.start.column > b.start.column);

const closes = (enable: Directive, disable: Directive): boolean =>
    enable.kind === "enable" &&
    isAfter(enable.loc, disable.loc) &&
    (enable.rules.length === 0 || disable.rules.every((rule) => enable.rules.includes(rule)));

const templateComments = (context: Rule.RuleContext): Comment[] => {
    const { templateBody } = context.sourceCode.ast as {
        templateBody?: AST.VElement & AST.HasConcreteInfo;
    };
    return (templateBody?.comments ?? []).filter(({ type }) => type === "HTMLComment");
};

const disableNeedsReason: Rule.RuleModule = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Require every eslint-disable comment to name its rules, give a reason and, as a block, be closed.",
        },
        schema: [],
        messages: {
            unnamed:
                "Name the rule this silences: `eslint-disable-next-line <rule> -- <why>`; a blanket disable also hides every other rule's report.",
            reason: "Say why after ` -- `: `eslint-disable-next-line <rule> -- <why this case is safe>`.",
            unclosed:
                "Close this with `eslint-enable <rule>` after the lines it covers, or use `eslint-disable-next-line`; left open, it silences the rest of the file.",
        },
    },
    create: (context) => {
        const check = (comments: Comment[]): void => {
            const directives = comments.map(parse).filter((directive) => directive !== undefined);
            for (const directive of directives) {
                if (directive.kind === "enable") continue;
                const { loc } = directive;
                if (directive.rules.length === 0) context.report({ loc, messageId: "unnamed" });
                if (!directive.reason) context.report({ loc, messageId: "reason" });
                if (
                    directive.kind === "disable" &&
                    !directives.some((enable) => closes(enable, directive))
                ) {
                    context.report({ loc, messageId: "unclosed" });
                }
            }
        };

        return {
            Program: () => {
                check(
                    context.sourceCode
                        .getAllComments()
                        .flatMap(({ value, loc }) => (loc ? [{ value, loc }] : [])),
                );
                check(templateComments(context));
            },
        };
    },
};

export default disableNeedsReason;
