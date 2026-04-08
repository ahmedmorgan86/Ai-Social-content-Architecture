import { GoogleGenAI, Type } from "@google/genai";
import { ContentResults } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateSocialContent(
  niche: string,
  activityType: string,
  targetAudience?: string,
  platforms: string[] = ['Instagram', 'TikTok'],
  tone: string = 'احترافي',
  duration: number = 7
): Promise<ContentResults> {
  const model = ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `قم بإنشاء محتوى احترافي لوسائل التواصل الاجتماعي لمجال ${niche} مع التركيز على ${activityType}. ${
      targetAudience ? `الجمهور المستهدف: ${targetAudience}.` : ""
    } المنصات المستهدفة: ${platforms.join(', ')}.
    نبرة الصوت المطلوبة: ${tone}.
    يجب أن تكون جميع النتائج باللغة العربية الفصحى وتتبع نبرة الصوت المحددة بدقة.
    المطلوب:
    - 5 أفكار إبداعية للمنشورات (مع مراعاة خصائص كل منصة مختارة)
    - 5 أفكار جذابة للفيديوهات (قصيرة لـ TikTok/Reels، طويلة لـ YouTube إذا تم اختياره)
    - 5 تعليقات (Captions) مقنعة (تتراوح بين القصيرة والمؤثرة والطويلة والمفصلة حسب المنصة)
    - 10 وسوم (Hashtags) رائجة لكل منصة
    - درجة جودة (0-100)
    - سيناريو فيديو كامل وجاهز للإنتاج لإحدى الأفكار، مصمم خصيصاً للمنصة الأكثر ملاءمة. يجب أن يتضمن السيناريو:
        * وصف تفصيلي للمشاهد (البصريات، الإضاءة، زوايا الكاميرا)
        * حوار الشخصيات (إن وجد) أو نص التعليق الصوتي
        * انتقالات واضحة وملاحظات حول الإيقاع
    - "خطاف" (Hook) قوي لأول 3 ثوانٍ يتناسب مع طبيعة التصفح السريع
    - تقويم محتوى لمدة ${duration} يوم (يوم، موضوع، منصة، تنسيق) يوزع المحتوى بذكاء على المنصات المختارة، مع دمج أفكار مبنية على التوجهات الحالية (Trends) في مجال ${niche}.
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
    model: "gemini-2.0-flash",
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
