import OpenAI from 'openai';
import { env } from '~/env.js';

export async function generateArticleSummary(content: string, title: string): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, skipping summary generation');
    return '';
  }

  // If content is empty or too short, return empty string
  if (!content || content.trim().length < 100) {
    console.warn('Article content too short for summary generation');
    return '';
  }

  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  try {
    // Use more content but cap it at a reasonable length
    const contentForSummary = content.slice(0, 3000);
    
    const prompt = `Please create a concise 2-3 sentence summary of this news article. Focus on the key facts and positive aspects. The summary should be informative yet engaging for quick scanning. Ignore any website navigation elements or metadata.

Article Title: ${title}

Article Content: ${contentForSummary}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise, positive news article summaries. Focus on key facts and beneficial outcomes. Keep summaries to 2-3 sentences maximum. Ignore any website navigation, metadata, or formatting elements - focus only on the actual article content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content?.trim() ?? '';
  } catch (error) {
    console.error('Error generating article summary:', error);
    return '';
  }
}