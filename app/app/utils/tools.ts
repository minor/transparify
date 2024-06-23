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
      
        console.log("HERERERE")
        console.log(response, toolCalls);

        return ret;
    }
};

const handleToolCalls = async (
    toolCalls: Groq.Chat.ChatCompletionMessageToolCall[]
  ) => {
    // Assumed only called with toolCalls > 0
    if (toolCalls.length == 0) {
      throw new Error("only call handleToolCalls with toolCalls > 0");
    }

    console.log("toolCalls: ", toolCalls);

    let ret: Groq.Chat.ChatCompletionMessageParam[] = [{ role: "assistant", tool_calls: toolCalls }]

    for (const toolCall of toolCalls) {
      const { function: toolFunction } = toolCall;
      if (toolFunction && toolHandlers[toolFunction.name]) {
        const toolResponse = await toolHandlers[toolFunction.name](
          JSON.parse(toolFunction.arguments)
        );

        ret = [
          ...ret,
          { role: "tool", content: toolResponse, tool_call_id: toolCall.id },
        ];
      }
    }

    console.log("toolCalls: ", ret[0]);

    return ret;
  };