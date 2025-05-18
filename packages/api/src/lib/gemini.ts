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

  // すべてのリトライが失敗した場合
  throw lastError || new Error('Failed to get response from Gemini API');
};

/**
 * 論文関連のプロンプトを生成する補助関数
 */
export const createRelatedPapersPrompt = (
  papers: {
    title: string;
    authors?: string;
    year?: number;
  }[],
  field: string,
): string => {
  const paperDescriptions = papers
    .map((paper) => {
      let desc = `タイトル: ${paper.title}`;
      if (paper.authors) desc += `\n著者: ${paper.authors}`;
      if (paper.year) desc += `\n年: ${paper.year}`;
      return desc;
    })
    .join('\n\n');

  // 分野情報がある場合はプロンプトに含める
  const fieldInfo = `研究分野: ${field}`;

  return `以下の論文に関連する論文を5つ提案してください。可能な限り5つの実在する論文のDOIを返してください。

重要条件:
1. 必ず5つの実在するDOIを返すよう最善を尽くしてください。
2. 返すDOIは全て https://doi.org/[DOI] でアクセスできるものでなければなりません。
3. 関連度が最も高いものから順に並べてください。
4. 過去に出版された重要な論文を選び、特に引用数が多い論文や有名な論文を優先してください。
5. 元の論文の研究分野と確実に関連性がある論文を選んでください。
6. もし確実な実在するDOIが5つ見つからない場合でも、できるだけ多くの確実なDOIを返してください。

出力手順:
1. あなたの知識の中で、上記論文群と関連が高い5つの論文を特定してください。
2. それぞれの論文のDOIを特定します。
3. 各DOIが https://doi.org/[DOI] で実際にアクセス可能か確認してください。
4. 確実に存在するDOIのみを以下の形式でリストアップしてください。
5. 必ず5つのDOIを返すよう努めてください。

出力形式:
DOI: 10.xxxx/xxxx
DOI: 10.xxxx/xxxx
DOI: 10.xxxx/xxxx
DOI: 10.xxxx/xxxx
DOI: 10.xxxx/xxxx

上記の形式で、確実に実在するDOIを5つ記載してください。特に以下のジャーナルや出版社の論文を優先すると良いでしょう: Nature, Science, PLOS, IEEE, ACM, Elsevier, Springer, Wiley。

元の論文:
${fieldInfo}
${paperDescriptions}

5つの確実に実在する関連論文のDOI:`;
};

/**
 * 研究動向・課題の要約プロンプトを生成する補助関数
 */
export const createResearchSummaryPrompt = (
  papers: {
    title: string;
    abstract?: string;
    authors?: string;
    year?: number;
  }[],
): string => {
  const paperDescriptions = papers
    .map((paper) => {
      let desc = `タイトル: ${paper.title}`;
      if (paper.authors) desc += `\n著者: ${paper.authors}`;
      if (paper.year) desc += `\n年: ${paper.year}`;
      if (paper.abstract) desc += `\n概要: ${paper.abstract}`;
      return desc;
    })
    .join('\n\n');

  return `以下の論文情報に基づいて、この研究分野のこれまでの流れと現在の課題について要約してください。
要約は以下の構造に従ってください:
1. 研究分野の概要（1段落）
2. 主要な研究の流れと発展（複数段落）
3. 現在の主要な課題（箇条書き）
4. 将来の研究方向性（1段落）

論文情報:
${paperDescriptions}`;
};
