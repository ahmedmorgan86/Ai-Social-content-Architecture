import { GoogleGenAI, Type } from "@google/genai";
import { ContentResults } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateSocialContent(
  niche: string,
  activityType: string,
  targetAudience?: string,
  platforms: string[] = ['Instagram', 'TikTok']
): Promise<ContentResults> {
  const model = ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `قم بإنشاء محتوى احترافي لوسائل التواصل الاجتماعي لمجال ${niche} مع التركيز على ${activityType}. ${
      targetAudience ? `الجمهور المستهدف: ${targetAudience}.` : ""
    } المنصات المستهدفة: ${platforms.join(', ')}.
    يجب أن تكون جميع النتائج باللغة العربية الفصحى.
    المطلوب:
    - 5 أفكار إبداعية للمنشورات
    - 5 أفكار جذابة للفيديوهات
    - 5 تعليقات (Captions) مقنعة
    - 10 وسوم (Hashtags) رائجة
    - درجة جودة (0-100)
    - سيناريو فيديو كامل وجاهز للإنتاج لإحدى الأفكار. يجب أن يتضمن السيناريو:
        * وصف تفصيلي للمشاهد (البصريات، الإضاءة، زوايا الكاميرا)
        * حوار الشخصيات (إن وجد) أو نص التعليق الصوتي
        * انتقالات واضحة وملاحظات حول الإيقاع
    - "خطاف" (Hook) قوي لأول 3 ثوانٍ
    - تقويم محتوى لمدة 7 أيام (يوم، موضوع، منصة، تنسيق)
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          postIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
          videoIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
          captions: { type: Type.ARRAY, items: { type: Type.STRING } },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          score: { type: Type.NUMBER },
          script: { 
            type: Type.STRING, 
            description: "A detailed production script with scene descriptions and dialogue/voiceover." 
          },
          hook: { type: Type.STRING },
          calendar: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                day: { type: Type.NUMBER },
                topic: { type: Type.STRING },
                platform: { type: Type.STRING },
                format: { type: Type.STRING }
              },
              required: ["day", "topic", "platform", "format"]
            } 
          }
        },
        required: ["postIdeas", "videoIdeas", "captions", "hashtags", "score", "calendar"]
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text || "{}");
}

export async function refineContent(
  previousResults: ContentResults,
  instruction: string
): Promise<ContentResults> {
  const model = ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `لديك استراتيجية محتوى سابقة: ${JSON.stringify(previousResults)}.
    المطلوب هو تعديل هذه الاستراتيجية بناءً على التعليمات التالية: "${instruction}".
    يجب أن تظل جميع النتائج باللغة العربية الفصحى وبنفس التنسيق السابق.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          postIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
          videoIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
          captions: { type: Type.ARRAY, items: { type: Type.STRING } },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          score: { type: Type.NUMBER },
          script: { type: Type.STRING },
          hook: { type: Type.STRING },
          calendar: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                day: { type: Type.NUMBER },
                topic: { type: Type.STRING },
                platform: { type: Type.STRING },
                format: { type: Type.STRING }
              },
              required: ["day", "topic", "platform", "format"]
            } 
          }
        },
        required: ["postIdeas", "videoIdeas", "captions", "hashtags", "score", "calendar"]
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text || "{}");
}
