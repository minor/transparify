import Groq from "groq-sdk"
import { factCheck } from "./factcheck"
import streamCompletion from "./groq_llm"

const toolHandlers: { [key: string]: (...args: any[]) => any } = {
    factCheck: factCheck,
};

export const triggerCompletionFlow = async (groq: Groq, text: string) => {
    const { contentBuffer: response, toolCalls } = await streamCompletion(
      [{ role: "user", content: text }],
      groq
    );

    if (toolCalls.length > 0) {
        const ret = await handleToolCalls(toolCalls);
        const functionCall = ret[1].content as string;
        if (functionCall.includes("incorrect") || functionCall.includes("wrong")) {
            return { text, functionCall };
        }
        const lowerContent = functionCall.toLowerCase();

        const conclusionIndex = lowerContent.indexOf("conclusion");

        if (conclusionIndex !== -1) {
            const afterConclusion = lowerContent.slice(conclusionIndex + "conclusion".length);
            if (/correct|vague/.test(afterConclusion)) {
                return { text, functionCall: "correct" };
            }
            if (/incorrect|false/.test(afterConclusion)) {
                return { text, functionCall };
            }
        }

        const beginning = lowerContent.slice(0, 20);
        if (/correct|vague/.test(beginning)) {
            return { text, functionCall: "correct" }; 
        }
        if (/correct|vague/.test(lowerContent)) {
            return { text, functionCall: "correct" };
        }
        return { text, functionCall: "correct" };
    }
};

const handleToolCalls = async (
  toolCalls: Groq.Chat.ChatCompletionMessageToolCall[]
) => {
  if (toolCalls.length == 0) {
      throw new Error("only call handleToolCalls with toolCalls > 0");
  }

  console.log("Handling tool calls:", toolCalls);

  let ret: Groq.Chat.ChatCompletionMessageParam[] = [{ role: "assistant", tool_calls: toolCalls }];

  for (const toolCall of toolCalls) {
      const { function: toolFunction } = toolCall;
      // console.log("Tool function to be called:", toolFunction);
      if (toolFunction && toolHandlers[toolFunction.name]) {
          console.log("Calling tool function with arguments: ", toolFunction.arguments);
          const toolResponse = await toolHandlers[toolFunction.name](
              JSON.parse(toolFunction.arguments)
          );
          console.log("Tool response:", toolResponse);

          ret = [
              ...ret,
              { role: "tool", content: toolResponse, tool_call_id: toolCall.id },
          ];
      }
  }

  return ret;
};
