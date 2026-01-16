import { GoogleGenAI, Type } from "@google/genai";
import { LotterySet, GeneratorMode, PastDraw, GuruStat } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to determine the next lottery draw date (1st or 16th)
// Updates automatically after 16:00 on draw days to the next period
export const getNextDrawDate = (): string => {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentHour = today.getHours();

  let targetDate: Date;

  // Logic:
  // 1. If today is 1st: Before 16:00 -> Today | After 16:00 -> 16th
  // 2. If today is 2nd-15th -> 16th
  // 3. If today is 16th: Before 16:00 -> Today | After 16:00 -> 1st Next Month
  // 4. If today is 17th-End -> 1st Next Month

  if (currentDay === 1) {
    if (currentHour >= 16) {
        targetDate = new Date(currentYear, currentMonth, 16);
    } else {
        targetDate = new Date(currentYear, currentMonth, 1);
    }
  } else if (currentDay > 1 && currentDay < 16) {
    targetDate = new Date(currentYear, currentMonth, 16);
  } else if (currentDay === 16) {
    if (currentHour >= 16) {
        targetDate = new Date(currentYear, currentMonth + 1, 1);
    } else {
        targetDate = new Date(currentYear, currentMonth, 16);
    }
  } else {
    targetDate = new Date(currentYear, currentMonth + 1, 1);
  }

  return targetDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const getLatestDrawResults = async (): Promise<PastDraw> => {
  try {
    // Prompt updated to find the actual most recent draw results
    const prompt = "Find the official results for the most recent Thai Government Lottery draw (ผลสลากกินแบ่งรัฐบาล งวดล่าสุด). Return the draw date in Thai (e.g. 16 มีนาคม 2568), the 1st prize (6 digits), the two 'front 3 digits' (3 digits each), the two 'rear 3 digits' (3 digits each), and the 'rear 2 digits'. Return strictly in JSON format.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                date: {type: Type.STRING},
                prize1: {type: Type.STRING},
                front3: {type: Type.ARRAY, items: {type: Type.STRING}},
                rear3: {type: Type.ARRAY, items: {type: Type.STRING}},
                rear2: {type: Type.STRING},
            }
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    // Extract web source from grounding metadata
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let sourceUrl = undefined;
    if (groundingChunks) {
       const webSource = groundingChunks.find((c: any) => c.web?.uri);
       if (webSource) sourceUrl = webSource.web.uri;
    }

    return {
        date: data.date || "ไม่พบข้อมูล",
        prize1: data.prize1 || "??????",
        front3: data.front3 || ["???", "???"],
        rear3: data.rear3 || ["???", "???"],
        rear2: data.rear2 || "??",
        sourceUrl
    };
  } catch (error) {
    console.error("Failed to fetch latest results:", error);
    // Return empty fallback
    return {
        date: "โหลดข้อมูลล้มเหลว",
        prize1: "??????",
        front3: ["???", "???"],
        rear3: ["???", "???"],
        rear2: "??",
    };
  }
};

export const getGuruStats = async (): Promise<GuruStat[]> => {
  try {
    const nextDate = getNextDrawDate();
    const prompt = `
      Analyze famous Thai Lottery prediction sources for the upcoming draw on ${nextDate}.
      Sources: "Mae Nam Nueng" (แม่น้ำหนึ่ง), "Je Fong Beer" (เจ๊ฟองเบียร์), "Je Nook" (เจ๊นุ๊ก บารมีมหาเฮง), and "Thai Lotto AI".
      
      For each source, provide:
      1. Name (in Thai)
      2. Alias/Style (e.g. "ธูปปู่", "ใบแนวทาง", "AI คำนวณ")
      3. Estimated accuracy percentage based on recent performance (60-95%)
      4. A list of 2 recent "wins" or correct predictions (Date, Prize Type like '2 ตัวล่าง', Number). Crucial: Search for actual recent wins from the last 1-3 draws.
      5. A short description string.
      6. "nextDrawPrediction": Find or predict their lucky numbers for ${nextDate}. 
         - "topPick": The single most prominent number (2 or 3 digits).
         - "secondary": An array of 2-3 other lucky numbers they are giving.
      
      Return as a JSON array.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              alias: { type: Type.STRING },
              accuracy: { type: Type.NUMBER },
              description: { type: Type.STRING },
              nextDrawPrediction: {
                type: Type.OBJECT,
                properties: {
                  topPick: { type: Type.STRING },
                  secondary: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              },
              wins: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    prize: { type: Type.STRING },
                    number: { type: Type.STRING },
                  }
                }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Failed to fetch guru stats:", error);
    // Fallback data if AI fails
    return [
      {
        id: "1",
        name: "แม่น้ำหนึ่ง",
        alias: "เจ้าแม่เลขเด็ด",
        accuracy: 88,
        description: "เน้นเลขธูปปู่และไลฟ์สดโค้งสุดท้าย",
        nextDrawPrediction: { topPick: "78", secondary: ["782", "59"] },
        wins: [
          { date: "ล่าสุด", prize: "2 ตัวล่าง", number: "34" },
          { date: "งวดก่อน", prize: "3 ตัวหน้า", number: "123" }
        ]
      },
      {
        id: "2",
        name: "Thai Lotto AI",
        alias: "ระบบคำนวณ",
        accuracy: 92,
        description: "ใช้สถิติและ Machine Learning ประมวลผล",
        nextDrawPrediction: { topPick: "42", secondary: ["428", "16"] },
        wins: [
          { date: "ล่าสุด", prize: "รางวัลที่ 1", number: "เฉียด" },
          { date: "งวดก่อน", prize: "2 ตัวล่าง", number: "92" }
        ]
      }
    ];
  }
};

export const generateLuckyNumbersAI = async (mode: GeneratorMode): Promise<LotterySet> => {
  try {
    const nextDrawDate = getNextDrawDate();
    let prompt = "";
    let systemInstruction = "";

    switch (mode) {
      case GeneratorMode.HISTORY:
        prompt = `Perform a statistical analysis for the upcoming Thai Government Lottery draw on ${nextDrawDate}. Analyze historical data for draws falling on this specific day or month. Identify recurrent patterns and 'hot' numbers. Predict the definite winning numbers for the draw on ${nextDrawDate}: 1x 6-digit (Prize 1), 2x 3-digit (Front 3), 2x 3-digit (Rear 3), 1x 2-digit (Rear 2). Provide a data-driven reasoning. Populate the 'sources' field with the datasets or statistical methods used (e.g., "10-Year History", "Monthly Statistics").`;
        systemInstruction = "You are a professional data analyst specializing in lottery probability and statistical history.";
        break;
      case GeneratorMode.GURU:
        prompt = `Aggregate predictions for the upcoming Thai Lottery draw on ${nextDrawDate} from famous sources: Mae Nam Nueng (แม่น้ำหนึ่ง), Por Pu Naka (พ่อปูนาคา), Luang Phor Pak Daeng (หลวงพ่อปากแดง), and "Ghost Whispers" (เลขผีบอก). Simulate the consensus of these gurus for the specific date of ${nextDrawDate}. Calculate a confidence percentage based on overlapping numbers. Return the definite set of numbers for this date. Populate the 'sources' field with the specific names of the gurus or entities that most influenced this set of numbers.`;
        systemInstruction = "You are an expert Thai Lottery aggregator who tracks famous spiritual figures, monks, and supernatural sources.";
        break;
      case GeneratorMode.AI:
      default:
        prompt = `Generate a definite set of lucky numbers for the Thai Lottery draw on ${nextDrawDate}. I need one 6-digit number for the First Prize, two 3-digit numbers for Front 3, two 3-digit numbers for Rear 3, and one 2-digit number for Rear 2. Focus your mystical energy on the specific date ${nextDrawDate} to produce the most auspicious numbers. Populate the 'sources' field with "Astrology", "Numerology", or "Dream Interpretation".`;
        systemInstruction = "You are a mystical fortune teller using numerology and astrology.";
        break;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prize1: { type: Type.STRING, description: "A 6-digit number string" },
            front3: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Two 3-digit number strings" 
            },
            rear3: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Two 3-digit number strings" 
            },
            rear2: { type: Type.STRING, description: "A 2-digit number string" },
            reasoning: { type: Type.STRING, description: "Explanation of the numbers" },
            confidence: { type: Type.NUMBER, description: "Probability percentage (0-100), especially for GURU/HISTORY modes." },
            sources: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of specific data sources or gurus used for this prediction."
            }
          },
          required: ["prize1", "front3", "rear3", "rear2", "reasoning"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    // Validate formatting just in case
    const prize1 = data.prize1?.padEnd(6, '0').slice(0, 6) || '000000';
    const rear2 = data.rear2?.padEnd(2, '0').slice(0, 2) || '00';
    const front3 = (data.front3 || []).map((n: string) => n.padEnd(3, '0').slice(0, 3));
    const rear3 = (data.rear3 || []).map((n: string) => n.padEnd(3, '0').slice(0, 3));

    // Ensure we have exactly 2 items for 3-digit arrays if API returns differently
    while (front3.length < 2) front3.push('000');
    while (rear3.length < 2) rear3.push('000');

    let sourceStr = 'AI';
    if (mode === GeneratorMode.HISTORY) sourceStr = 'HISTORY';
    if (mode === GeneratorMode.GURU) sourceStr = 'GURU';

    return {
      prize1,
      front3: front3.slice(0, 2),
      rear3: rear3.slice(0, 2),
      rear2,
      source: sourceStr as any,
      reasoning: data.reasoning || "Analysis complete.",
      confidence: data.confidence || undefined,
      sources: data.sources || [],
      drawDate: nextDrawDate,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error("AI Generation failed:", error);
    throw new Error("Failed to consult the oracle.");
  }
};