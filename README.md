# 国旗学習アプリ

ゲーム感覚で楽しみながら世界の国旗を暗記できるWebアプリケーションです。

## ✨ 主な機能

- **クイズモード**: 国旗を見て国名を選ぶ、または国名を見て国旗を選ぶ2種類のクイズ形式で、スコアを競います。
  - キーボードショートカット対応: Ctrl+Enter でクイズ開始、矢印キーで選択、Enterで回答送信
  - 難易度設定: 簡単（4択）、普通（6択）、難しい（8択）
  - 出題範囲設定: 全世界、アフリカ、アジア、ヨーロッパ、北アメリカ、南アメリカ、オセアニア
  - 画像プリロード: 次の問題の画像を事前読み込みし、スムーズな問題移行を実現
  
- **学習モード**: フラッシュカード形式で、国旗、国名、首都、大陸、地図、概要、国旗の由来をじっくり学習できます。
  - キーボードショートカット: 矢印キーで前後移動、スペースキーで表裏切り替え
  - 長文はマウスホバー/タッチでポップアップ表示
  - 画像の最適化: 即座に読み込まれる高速表示
  
- **ランキング機能**: クイズで獲得したスコアを地域別・期間別・形式別で競い合えます。
  - 地域別ランキング: 全世界、アフリカ、アジア、ヨーロッパ、北アメリカ、南アメリカ、オセアニア
  - 期間別ランキング: 日次ランキング（当日のスコア）、全期間トップ5
  - 形式別ランキング: 国旗→国名、国名→国旗で別々のランキング
  - トップ3にはメダル表示（🥇🥈🥉）
  - ニックネームの自動保存（localStorage）

- **多言語対応**: 日本語・英語の切り替えに対応

## 🛠️ 使用技術

### フロントエンド
- [Vue.js](https://vuejs.org/) (v3, Composition API)
- [Vite](https://vitejs.dev/)
- [Pinia](https://pinia.vuejs.org/)
- [Vue Router](https://router.vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

### アーキテクチャ
- **再利用可能コンポーネント**: DRY原則に基づいた設計
  - 共通UIコンポーネント: LanguageSelector, LoadingSpinner, ErrorMessage, AppButton
  - クイズ設定コンポーネント: RegionSelector, QuizFormatSelector
  - 学習用コンポーネント: FlagCard, CountryDetailCard
- **レスポンシブデザイン**: モバイルファーストの設計
  - スマホとPCで最適化された異なるレイアウト
  - ランキング: PC版はテーブル、スマホ版はカード形式
  - フォーム: 画面サイズに応じた適切なサイズとスペーシング
  - バリデーションエラーの画面内表示
- **CI/CD**: GitHub Actions による自動テスト・デプロイパイプライン

### バックエンド
- [Hono](https://hono.dev/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/) (データベース)

### データソース
- [Wikipedia](https://www.wikipedia.org/) (国旗画像、地図画像、国旗の由来、概要など)
  - データ取得には [wikijs](https://www.npmjs.com/package/wikijs) を使用
- [Wikidata](https://www.wikidata.org/wiki/Wikidata:Main_Page) (大陸情報: P30、首都情報: P36)
  - Wikidata APIを直接使用し、言語別ラベルを取得

## 🚀 ローカルでの実行方法

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 国データの生成
Wikipedia と Wikidata から国旗や国の情報を取得し、アプリケーションが使用する `public/countries.ja.json` と `public/countries.en.json` を生成します。
**注意**: この処理は外部APIにアクセスするため、時間がかかる場合があります（約30分〜1時間）。

1.  **国名リストの生成**
    ```bash
    npm run batch:create-list
    ```
    Wikipedia の "国の一覧" ページから国名リストを生成します。
    
2.  **国データの生成と画像ダウンロード**
    ```bash
    npm run batch:create-data
    ```
    各国について以下の情報を取得します：
    - 国旗画像（`public/flags/` にダウンロード）
    - 地図画像（`public/maps/` にダウンロード）
    - 首都（Wikidata P36 から取得、言語別ラベル）
    - 大陸（Wikidata P30 から取得、言語別ラベル）
    - 概要（Wikipedia の要約セクション）
    - 国旗の由来（"Flag of [Country]" ページから取得）
    
    処理は各国ごとに保存されるため、中断しても再実行時に続きから再開できます。

### 3. データベースのセットアップ
ローカルのD1データベースにテーブルを作成します。

```bash
npx wrangler d1 migrations apply national-flag-game-db --local
```
初回実行時に確認を求められた場合は `Y` を入力してください。

このコマンドで以下のテーブルが作成されます：
- `ranking_daily`: 日次ランキング（nickname, region, format, date ごとに UNIQUE）
- `ranking_all_time`: 全期間ランキング（region と format ごとのベストスコア）

### 4. 開発サーバーの起動
フロントエンド（Vite）とバックエンド（Wrangler）の開発サーバーを同時に起動します。

```bash
npm run dev
```
起動後、ブラウザで `http://localhost:5173` にアクセスしてください。

## 🧪 テスト

このプロジェクトでは [Vitest](https://vitest.dev/) を使用して包括的なテストを実行します。

### テストの実行
```bash
# 全テストを実行（ウォッチモード）
npm test

# 全テストを1回だけ実行
npm run test:run

# UIでテストを実行
npm run test:ui

# カバレッジレポート付きでテストを実行
npm run test:coverage
```

### コード品質チェック

このプロジェクトでは [Biome](https://biomejs.dev/) を使用した高速なリンティングとフォーマットを行っています。

```bash
# コードのリントチェック
npm run lint

# リンターのエラーを自動修正
npm run lint:fix

# コードのフォーマット
npm run format
```

### テストカバレッジ
✅ **113テスト、100%合格率**

- **ストアのテスト** (32テスト)
  - Countries Store: データ取得、言語切り替え、フィルタリング (14テスト)
  - Quiz Store: クイズ設定、問題生成、回答処理、スコア計算 (11テスト)
  - Ranking Store: ランキング取得、スコア送信 (7テスト)

- **コンポーネントのテスト** (55テスト)
  - Home: 言語選択、ナビゲーション (8テスト)
  - QuizSetup: 入力バリデーション、XSS対策、localStorage連携 (14テスト)
  - Study: カード操作、地域フィルタリング、キーボードショートカット (22テスト)
  - LazyImage: 遅延読み込み、Intersection Observer API、画像ロード (11テスト)

- **ユーティリティのテスト** (16テスト)
  - バリデーション: ニックネーム検証、セキュリティチェック、XSS対策

- **APIのテスト** (10テスト)
  - Server: スコア計算、入力検証、セキュリティチェック

### CI/CD統合
- GitHub Actions による自動テスト実行（プルリクエスト時）
- テスト成功後の自動デプロイ（main/master ブランチへのマージ時）

詳細は [テスト仕様書](./docs/06_test_specification.md) を参照してください。

## 🎨 開発ワークフロー

### Pre-commit Hooks

このプロジェクトでは、コミット前に自動的にコード品質チェックとフォーマットを実行します。

- **自動実行**: `git commit` すると、ステージングされたファイルに対して自動的にBiomeが実行されます
- **自動修正**: リンターが検出した問題は自動的に修正されます
- **エラー防止**: エラーがある場合、コミットはブロックされます

詳細は [Pre-commit Hooks 設定ガイド](./docs/09_pre_commit_hooks.md) を参照してください。

#### 手動でのコード品質チェック

```bash
# リンターチェック
npm run lint

# リンターの自動修正
npm run lint:fix

# フォーマット
npm run format
```

## 🚀 本番環境へのデプロイ

このアプリケーションは Cloudflare Pages にデプロイされます。

### デプロイ手順

#### 1. Cloudflare にログイン
```bash
npx wrangler login
```

#### 2. D1 データベースの作成（初回のみ）
```bash
npx wrangler d1 create national-flag-game-db
```
出力された `database_id` を `wrangler.toml` に設定してください。

#### 3. マイグレーションの適用（初回のみ）
```bash
npx wrangler d1 migrations apply national-flag-game-db --remote
```

#### 4. デプロイ
```bash
npm run deploy
```

#### 5. D1 バインディングの設定（初回のみ）
Cloudflare ダッシュボードで以下の設定を行います：

1. https://dash.cloudflare.com/ にアクセス
2. **Workers & Pages** → **national-flag-game** を選択
3. **Settings** タブ → **Functions** → **D1 database bindings**
4. **Add binding** をクリック
   - Variable name: `DB`
   - D1 database: `national-flag-game-db` を選択
5. **Save** をクリック

### デプロイコマンド

```bash
# 本番環境へデプロイ（ビルド + デプロイ）
npm run deploy

# プレビュー環境へデプロイ
npm run deploy:preview
```

### デプロイ後の確認

デプロイが完了すると、以下のような URL が表示されます：
```
https://[deployment-id].national-flag-game.pages.dev
```

この URL にアクセスしてアプリケーションの動作を確認してください。

### GitHub Actions による自動テスト・デプロイ

#### CI/CDパイプライン
1. **プルリクエスト時**: 自動的にテストを実行（マージ前の品質チェック）
2. **main/master ブランチへのマージ時**: テスト成功後に自動デプロイ

このワークフローにより、コードの品質を保ちながら安全にデプロイできます。

#### 初回設定（GitHub Secrets）

1. **Cloudflare API トークンを取得**: https://dash.cloudflare.com/profile/api-tokens
2. **Cloudflare アカウント ID を取得**: `npx wrangler whoami`
3. **GitHub リポジトリの Settings** → **Secrets and variables** → **Actions**
4. 以下の2つの Secret を追加:
   - `CLOUDFLARE_API_TOKEN`: Cloudflare API トークン
   - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare アカウント ID

詳細は [GitHub Actions 自動デプロイ設定ガイド](./docs/08_github_actions.md) を参照してください。

## � ディレクトリ構造

```
.
├── functions/       # Cloudflare Pages Functions (バックエンドAPI)
├── migrations/      # D1 データベースのマイグレーションファイル
├── public/          # 静的ファイル (国データJSON、ダウンロードされた国旗・地図画像など)
│   ├── flags/       # ダウンロードされた国旗画像
│   └── maps/        # ダウンロードされた地図画像
├── scripts/         # データ生成などのバッチスクリプト
└── src/
    ├── assets/      # 画像などのアセット
    ├── components/  # 共通コンポーネント
    ├── router/      # Vue Router の設定
    ├── server/      # (現在は未使用) Honoサーバーの旧格納場所
    ├── store/       # Pinia ストア (状態管理)
    ├── views/       # 各画面のVueコンポーネント
    ├── App.vue      # アプリケーションのルートコンポーネント
    ├── main.ts      # アプリケーションのエントリーポイント
    └── style.css    # グローバルスタイル
```