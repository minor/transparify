import Groq from "groq-sdk";

export async function factCheck({ statement }: { statement: string }) {
  console.log("Fact-checking statement: ", statement);
    
  try {
      const response = await fetch('/api/factcheck', { 
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ statement })
      });

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Fact-check result: ", result);
      return result;
  } catch (error) {
      console.error("Error in factCheck:", error);
      return { status: "error", details: "Failed to perform fact-check" };
  }
}

export const factCheckSchema: Groq.Chat.Completions.ChatCompletionTool = {
    type: "function",
    function: {
      name: "factCheck",
      description: "Fact check a complete true or false statement.",
      parameters: {
        type: "object",
        properties: {
          statement: { type: "string", description: "A completely formed statement that is NOT an opinion to be fact checked" },
        },
      },
    },
  };