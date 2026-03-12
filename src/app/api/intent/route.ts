import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { intent, arsenal } = await req.json();

    // Using flash for maximum speed
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
    You are an elite OS workflow orchestrator. 
    The user's intent is: "${intent}"
    
    Available installed apps & core tools:
    ${JSON.stringify(arsenal)}
    
    CRITICAL INSTRUCTIONS:
    1. NEVER return a web browser as an 'app' (do not return msedge.exe, chrome.exe, etc.). If the user needs a website or web app, ALWAYS return type: "url" with the specific, highly-relevant website URL.
    2. BE PROACTIVE WITH URLS: If the user asks for "market charts" or "trading", provide specific URLs like "https://www.tradingview.com" or their broker.
    3. FOCUS MUSIC: If the user indicates "focused work" or wants music, check the arsenal for music apps (Spotify, Apple Music). If found, use them. If NOT found, return type: "url" with "https://music.youtube.com/search?q=deep+focus+lofi+beats" and set position to "background".
    4. EXACT PATHS: If you select an 'app' from the arsenal, return its exact path. Do not guess or modify paths.
    5. SPATIAL LAYOUT: Assign "left", "right", "maximized", or "background" to the 'position' key.
    
    Respond ONLY with a valid JSON array of objects. Do not include markdown formatting.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Safety fallback to strip markdown if the LLM includes it
    if (text.startsWith('```json')) {
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    const tools = JSON.parse(text);
    return NextResponse.json({ tools });

  } catch (error) {
    console.error("AI Engine Error:", error);
    return NextResponse.json({ error: 'Failed to process intent' }, { status: 500 });
  }
}
