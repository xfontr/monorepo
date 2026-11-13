#!/usr/bin/env node
import { run } from "../shared/cli.ts";
import { drop } from "./drop.ts";
import { file } from "./file.ts";
import { next } from "./next.ts";
import { setup } from "./setup.ts";
import { sync } from "./sync.ts";

await run({ setup, sync, next, file, drop });
