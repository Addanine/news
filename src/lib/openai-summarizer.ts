import OpenAI from 'openai';
import { env } from '~/env.js';

export async function streamArticleSummary(content: string, title: string): Promise<ReadableStream<Uint8Array> | null> {
  if (!env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, skipping summary generation');
    return null;
  }

  if (!content || content.trim().length < 100) {
    console.warn('Article content too short for summary generation');
    return null;
  }

  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  try {
    const contentForSummary = content.slice(0, 3000);
    
    const prompt = `Please create a concise 2-3 sentence summary of this news article. Focus on the key facts and positive aspects. The summary should be informative yet engaging for quick scanning. Ignore any website navigation elements or metadata.

Article Title: ${title}

Article Content: ${contentForSummary}`;

    const stream = await openai.chat.completions.create({
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
      stream: true,
    });

    const encoder = new TextEncoder();
    
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Error streaming summary:', error);
          controller.error(error);
        }
      },
    });
  } catch (error) {
    console.error('Error generating article summary:', error);
    return null;
  }
}

export async function generateArticleSummary(content: string, title: string): Promise<string> {
  if (!env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, skipping summary generation');
    return '';
  }

  if (!content || content.trim().length < 100) {
    console.warn('Article content too short for summary generation');
    return '';
  }

  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  try {
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