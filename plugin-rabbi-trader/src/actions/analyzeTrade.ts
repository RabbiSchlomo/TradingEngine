import {
  Action,
  composeContext,
  elizaLogger,
  generateText,
  ModelClass,
  parseJSONObjectFromText,
} from "@ai16z/eliza";
import { tradeAnalysisTemplate } from "../templates";

export const analyzeTradeAction: Action = {
  name: "ANALYZE_TRADE",
  description: "Analyze a token for trading opportunities",
  similes: [
    "ANALYZE",
    "ANALYZE_TOKEN",
    "TRADE",
    "ANALYZE_TRADE",
    "EVALUATE",
    "ASSESS",
  ],
  examples: [],
  validate: async () => true,
  handler: async (runtime, memory, state, params, callback) => {
    try {
      // composeState
      if (!state) {
        state = await runtime.composeState(memory);
      } else state = await runtime.updateRecentMessageState(state);

      // Compose the context with template and data
      const context = composeContext({
        template: tradeAnalysisTemplate,
        state: {
          ...state,
          tokenData: JSON.stringify({
            walletBalance: params.walletBalance,
            tokenAddress: params.tokenAddress,
            price: params.price,
            volume: params.volume,
            marketCap: params.marketCap,
            liquidity: params.liquidity,
            holderDistribution: params.holderDistribution,
            trustScore: params.trustScore,
            dexscreener: params.dexscreener,
            position: params.position,
          }),
        },
      });

      elizaLogger.log(`Generated analysis context:`, context);

      // Generate upload content
      const content = await generateText({
        runtime,
        context: context,
        modelClass: ModelClass.LARGE,
      });

      if (!content) {
        throw new Error("No analysis generated");
      }

      elizaLogger.log(`Raw analysis response:`, content);

      // Parse the response to get the recommended action
      const recommendation = parseJSONObjectFromText(content);
      elizaLogger.log(
        `Parsed recommendation for ${params.tokenAddress}:`,
        recommendation,
      );

      // Send result through callback
      if (callback) {
        await callback({
          text: JSON.stringify(recommendation),
          type: "analysis",
        });
      }

      return true;
    } catch (error) {
      elizaLogger.error(`Analysis failed:`, {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  },
};
