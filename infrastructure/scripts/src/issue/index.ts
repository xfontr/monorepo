#!/usr/bin/env node
import { run } from "../shared/cli.ts";
import { add } from "./add.ts";
import { pick } from "./pick.ts";

await run({ add, pick });
