import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { LlmPrompts } from '@/lib/common';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🟦 Received request:', req.method);

  if (req.method !== 'POST') {
    console.log('🔴 Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENAI_API_URL || !process.env.OPENAI_MODEL) {
    console.log('🔴 Missing OpenAI config');
    return res.status(500).json({ error: 'OpenAI configuration is missing' });
  }

  try {
    const { message, purpose } = req.body;
    console.log('🟩 Processing message:', message);

    if (!message || !purpose) {
      console.log('🔴 Missing message or purpose');
      return res.status(400).json({ error: 'Message and purpose are required' });
    }

    let prompt = LlmPrompts[purpose] + message;

    console.log('🟨 Creating OpenAI client with URL:', process.env.OPENAI_API_URL);
    const client = new OpenAI({
      baseURL: process.env.OPENAI_API_URL
    });

    console.log('🟪 Requesting chat completion with model:', process.env.OPENAI_MODEL);
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.OPENAI_MODEL
    });

    console.log('✅ Chat completion successful');
    return res.status(200).json(chatCompletion);

  } catch (error) {
    console.log('🔴 Error occurred:', error);
    console.error('Chat completion error:', error);
    return res.status(500).json({ error: 'Failed to get chat completion' });
  }
}
