import Groq from "groq-sdk";

export async function factCheck({ statement }: { statement: string }) {
    console.log("statement: ", statement)
      
    const out = await fetch('/api/factcheck', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ statement })
     })
        .then(response => response.json())
        .then(response => response)
        .catch(err => console.error(err));

    console.log("out: ", out)

    return out
}

export const factCheckSchema: Groq.Chat.Completions.ChatCompletionTool = {
    type: "function",
    function: {
      name: "factCheck",
      description: "Fact check a complete true or false statement",
      parameters: {
        type: "object",
        properties: {
          statement: { type: "string", description: "A completly formed statement that is not an opinion to be fact checked" },
        },
      },
    },
  };