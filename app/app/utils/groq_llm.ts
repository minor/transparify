import Groq from "groq-sdk";
import { factCheckSchema } from "./factcheck";

export default async function streamCompletion(
    messages: Groq.Chat.ChatCompletionMessageParam[],
    groq: Groq
  ): Promise<{
    contentBuffer: string;
    toolCalls: Groq.Chat.ChatCompletionMessageToolCall[];
  }> {
    const startTime = performance.now();
    const stream = true;
    const toolCallDeltas = [];
  
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a brilliant assistant that determines whether or not something should be fact checked.
                    You should fact check a statement if and only it is a statement that can be proven true or false.
                    Only use the fact check tool for complete statements, not questions or incomplete thoughts.
                    If the user gives a statement that is not a fact checkable statement, you should respond with "None".`,
        },
        /*{
            role: "user",
            content: "There are 80"
        },
        {
            role: "assistant",
            content: "None"
        },*/
        ...messages,
      ],
      tools: [factCheckSchema],
      model: "llama3-70b-8192",
      temperature: 0.7,
      max_tokens: 1024,
      seed: 42,
      top_p: 1,
      stream: stream,
    });

    console.log("messages: ", messages)
  
    let contentBuffer = "";
    if (stream) {
      // @ts-ignore
      for await (const chunk of response) {
        if (chunk.choices[0]?.delta?.content) {
          contentBuffer += chunk.choices[0]?.delta?.content;
        }
        if (chunk.choices[0].delta.tool_calls) {
          toolCallDeltas.push(...chunk.choices[0].delta.tool_calls);
        }
      }
    } else {
      // @ts-ignore
      contentBuffer = response.choices[0].message.content;
    }
    const endTime = performance.now();
    console.log(`[COMPLETION]: ${(endTime - startTime).toFixed(2)} ms`);
  
    // Convert toolCallDeltas to toolCalls
    const toolCallBuffers: { [key: number]: Groq.Chat.ChatCompletionMessageToolCall } = {};
  
    for (const toolCallDelta of toolCallDeltas) {
      const index = toolCallDelta.index;
      if (!toolCallBuffers[index]) {
        toolCallBuffers[index] = {
          id: toolCallDelta.id || "",
          type: "function",
          function: {
            arguments: "",
            name: "",
          },
        };
      }
      if (toolCallDelta.function?.arguments) {
        toolCallBuffers[index].function.arguments += toolCallDelta.function.arguments;
      }
      if (toolCallDelta.function?.name) {
        toolCallBuffers[index].function.name += toolCallDelta.function.name;
      }
    }
  
    const toolCalls: Groq.Chat.ChatCompletionMessageToolCall[] = Object.values(toolCallBuffers);
  
    return { contentBuffer, toolCalls };
  }
