import type { Context } from 'hono';
import { getGeminiApiKey } from '../utils/env';

// Gemini APIのエンドポイント
const GEMINI_API_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1/models';
const GEMINI_MODEL = 'gemini-2.0-flash';

// リクエストの型定義
export type GeminiRequestContent = {
  parts: {
    text: string;
  }[];
};

export type GeminiRequest = {
  contents: GeminiRequestContent[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
};

// レスポンスの型定義
export type GeminiResponse = {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
    finishReason: string;
  }[];
  promptFeedback?: {
    blockReason?: string;
  };
};

// エラーレスポンスの型定義
export type GeminiErrorResponse = {
  error: {
    code: number;
    message: string;
    status: string;
    details?: unknown[];
  };
};

// リトライ設定
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Gemini APIにテキストプロンプトを送信して応答を取得する
 */
export const generateTextWithGemini = async (
  c: Context<{ Bindings: CloudflareBindings }>,
  prompt: string,
  options: {
    temperature?: number;
    maxOutputTokens?: number;
    retries?: number;
  } = {},
): Promise<string> => {
  const apiKey = getGeminiApiKey(c);
  const url = `${GEMINI_API_ENDPOINT}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const request: GeminiRequest = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 1024,
    },
  };

  const maxRetries = options.retries ?? MAX_RETRIES;
  let lastError: Error | null = null;

  // リトライロジック
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as GeminiErrorResponse;
        throw new Error(`Gemini API error: ${errorData.error.message}`);
      }

      const result = data as GeminiResponse;

      // コンテンツブロックのチェック
      if (result.promptFeedback?.blockReason) {
        throw new Error(
          `Content blocked: ${result.promptFeedback.blockReason}`,
        );
      }

      // 応答が空の場合
      if (!result.candidates || result.candidates.length === 0) {
        throw new Error('No response generated');
      }

      // テキスト応答の抽出
      return result.candidates[0].content.parts[0].text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `Gemini API attempt ${attempt + 1}/${maxRetries} failed:`,
        lastError.message,
      );

      // 最後の試行でなければ待機してリトライ
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)),
        );
      }
    }
  }
