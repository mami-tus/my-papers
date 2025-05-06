import { fetchPaperMetadata } from './crossref';

// global.fetchをモック化
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('fetchPaperMetadata (モックテスト)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常なDOIでメタデータを取得できる', async () => {
    // モックレスポンスの準備
    const mockResponse = {
      message: {
        DOI: '10.1098/rsos.231415',
        title: ['テスト論文タイトル'],
        'published-online': {
          'date-parts': [[2023, 5, 15]],
        },
        author: [
          { given: '太郎', family: '山田' },
          { given: '花子', family: '鈴木' },
        ],
      },
    };

    // fetchのモック実装
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    // 関数の実行
    const result = await fetchPaperMetadata('10.1098/rsos.231415');

    // 期待される結果
    expect(result).toEqual({
      doi: '10.1098/rsos.231415',
      title: 'テスト論文タイトル',
      year: 2023,
      month: 5,
      day: 15,
      authors: ['太郎 山田', '花子 鈴木'],
    });

    // fetchが正しいURLとヘッダーで呼ばれたか検証
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.crossref.org/works/10.1098%2Frsos.231415',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      })
    );
  });

  it('DOIが見つからない場合はnullを返す', async () => {
    // 404レスポンスをモック
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    // 関数の実行
    const result = await fetchPaperMetadata('10.1234/not-exist');

    // nullが返されることを確認
    expect(result).toBeNull();
  });

  it('APIエラーの場合は例外をスロー', async () => {
    // サーバーエラーをモック
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    // 関数の実行と例外の検証
    await expect(fetchPaperMetadata('10.1098/rsos.231415')).rejects.toThrow(
      'CrossRef API エラー: 500 Internal Server Error'
    );
  });

  it('ネットワークエラーの場合は例外をスロー', async () => {
    // ネットワークエラーをモック
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    // 関数の実行と例外の検証
    await expect(fetchPaperMetadata('10.1098/rsos.231415')).rejects.toThrow(
      '論文メタデータの取得に失敗しました: Network failure'
    );
  });
});
