import { describeWorkflow, runWorkflowCases } from "../../src/index.js";
import { cases } from "./sdd-workflow.cases.js";

describeWorkflow("sdd", () => runWorkflowCases(cases));
