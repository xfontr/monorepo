import { ExpectedError } from "../shared/errors.ts";
import { out } from "../shared/adapters/io.ts";
import { readPackages } from "./adapters/files.ts";
import { validatePackage } from "./domain/validate.ts";

export const main = (): void => {
    const reports = readPackages().map(validatePackage);
    const errors = reports.flatMap((report) => report.errors);

    for (const report of reports) {
        if (report.errors.length === 0) {
            out.success(`Checked ${report.packageName} — package metadata and exports are valid.`);
        }
        else {
            out.error(`Checked ${report.packageName} — ${report.errors.length} contract error(s).`);
            for (const error of report.errors) out.error(`  ${error}`);
        }

        for (const skipped of report.skipped) out.info(`⏭ Skipped ${report.packageName}: ${skipped}.`);
    }

    if (errors.length > 0) {
        throw new ExpectedError(`package:check found ${errors.length} contract error(s).`);
    }
};
