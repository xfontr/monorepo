#!/usr/bin/env node
import { run } from "../shared/cli.ts";
import { main } from "./main.ts";

await run(main);
