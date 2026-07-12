import howToRuleCopy from "./how-to-rule.json" with { type: "json" };

interface HowToRuleStep {
	title: string;
	body: string;
}

const HOW_TO_RULE_STEPS: HowToRuleStep[] = (
	howToRuleCopy as { steps: HowToRuleStep[] }
).steps;

export type { HowToRuleStep };
export { HOW_TO_RULE_STEPS };
