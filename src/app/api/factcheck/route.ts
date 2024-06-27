import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { statement } = await request.json();
    console.log("Received statement: ", statement);
    // const key = process.env.YOU_DOT_COM_API_KEY;
    // if (!key) {
    //     return NextResponse.json("API key not found", { status: 500 });
    // }
    // const options = {
    //     method: 'POST',
    //     headers: {
    //     'X-API-Key': key,
    //     'Content-Type': 'application/json'
    //     },
    //     body: `{"query":"fact check this statement: '${statement}' Answer in two or three very short sentences. If the statement is correct, give a one word response: 'correct'. If the statement is too vague, response with 'vague'."}`
    // };

    // const response = await fetch('https://chat-api.you.com/research', options);
    // const data = await response.json();

    // return NextResponse.json(data.answer, { status: response.status });
}