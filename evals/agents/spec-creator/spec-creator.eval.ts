import { describeAgent, runAgentCases } from "../../src/index.js";
import { cases } from "./spec-creator.cases.js";

describeAgent("spec-creator", () => runAgentCases("sdd-engineering", "spec-creator", cases));
