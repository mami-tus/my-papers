// 論文メタデータの型定義
type PaperMetadata = {
  doi: string;
  title: string;
  year: number | null;
  month: number | null;
  day: number | null;
  authors: string[] | null;
};

type CrossRefDateParts = {
  'date-parts': number[][];
};

type CrossRefAuthor = {
  given?: string;
  family?: string;
};

type CrossRefResponse = {
  message: {
    DOI: string;
    title?: string[];
    'published-print'?: CrossRefDateParts;
    'published-online'?: CrossRefDateParts;
    author?: CrossRefAuthor[];
  };
};

// CrossRef APIから論文メタデータを取得する関数
export const fetchPaperMetadata = async (
  doi: string
): Promise<PaperMetadata | null> => {
  try {
    // DOIをエンコード
    const encodedDoi = encodeURIComponent(doi);
    const url = `https://api.crossref.org/works/${encodedDoi}`;

    // ヘッダーにメールアドレスを追加（推奨）
    const headers = {
      'User-Agent': 'MyPapersApp (mailto:your-email@example.com)',
      Accept: 'application/json',
    };

    // APIリクエスト送信
    const response = await fetch(url, { headers });

    // レスポンスのステータスコードをチェック
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`論文が見つかりません: DOI ${doi}`);
        return null;
      }
      throw new Error(
        `CrossRef API エラー: ${response.status} ${response.statusText}`
      );
    }

    // JSONレスポンスのパース
    const data = (await response.json()) as CrossRefResponse;
    const {
      DOI,
      title,
      'published-print': publishedPrint,
      'published-online': publishedOnline,
      author,
    } = data.message;

    // メタデータの抽出と整形
    const metadata: PaperMetadata = {
      doi: DOI,
      title: title ? title[0] : 'no title',
      year: publishedOnline
        ? publishedOnline['date-parts'][0][0]
        : publishedPrint
        ? publishedPrint['date-parts'][0][0]
        : null,
      month: publishedOnline
        ? publishedOnline['date-parts'][0][1]
        : publishedPrint
        ? publishedPrint['date-parts'][0][1]
        : null,
      day: publishedOnline
        ? publishedOnline['date-parts'][0][2]
        : publishedPrint
        ? publishedPrint['date-parts'][0][2]
        : null,
      authors: author
        ? author.map((author) =>
            // 名と姓を配列にし、nullやundefinedを除去してから空白で連結
            [author.given, author.family].filter(Boolean).join(' ')
          )
        : [],
    };

    return metadata;
  } catch (error) {
    console.error('論文メタデータの取得に失敗しました:', error);
    throw new Error(
      `論文メタデータの取得に失敗しました: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
