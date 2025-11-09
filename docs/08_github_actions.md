# GitHub Actions 自動テスト・デプロイ設定ガイド

## 概要
このガイドでは、GitHub のプルリクエスト作成時およびmain/masterブランチへのマージ時に、自動的にテストを実行し、Cloudflare Pagesへデプロイする設定方法を説明します。

## ワークフローの構成

本プロジェクトでは、以下の2つのGitHub Actionsワークフローを使用しています:

### 1. テストワークフロー (`.github/workflows/test.yml`)
プルリクエスト時とブランチへのプッシュ時に自動実行されます。

**トリガー**:
- プルリクエストがmain/masterブランチに対して作成された時
- main/masterブランチへのプッシュ時

**実行内容**:
1. リポジトリのチェックアウト
2. Node.js 20のセットアップ
3. 依存関係のインストール (`npm ci`)
4. テストの実行 (`npm test -- --run`)
5. ビルド（型チェック含む） (`npm run build`)

### 2. デプロイワークフロー (`.github/workflows/deploy.yml`)
main/masterブランチへのプッシュ時のみ自動実行され、テスト成功後にデプロイします。

**トリガー**:
- main/masterブランチへのプッシュ時のみ

**実行内容**:
1. **testジョブ**: テストを実行
2. **deployジョブ**: テストが成功した後にのみ実行（`needs: test`）
   - リポジトリのチェックアウト
   - Node.js 20のセットアップ
   - 依存関係のインストール
   - ビルド
   - Cloudflare Pagesへのデプロイ

## ワークフローの利点

- **品質保証**: プルリクエスト時に必ずテストが実行され、問題を早期発見
- **自動デプロイ**: mainブランチへのマージ時に自動でデプロイ
- **安全性**: テストが失敗した場合、デプロイは実行されない
- **ブランチ保護**: GitHubのブランチ保護ルールと組み合わせることで、テスト失敗時のマージを防止

## 前提条件
- GitHub リポジトリが作成済み
- Cloudflare アカウントが作成済み
- プロジェクトが Cloudflare Pages にデプロイ済み

## 設定手順

### 1. Cloudflare API トークンの取得

#### ステップ 1: Cloudflare ダッシュボードにアクセス
```
https://dash.cloudflare.com/profile/api-tokens
```

#### ステップ 2: API トークンを作成
1. **Create Token** ボタンをクリック
2. **Edit Cloudflare Workers** テンプレートを選択（または Custom token）
3. 以下の権限を設定:
   - **Account** → **Cloudflare Pages** → **Edit**
4. **Account Resources** で自分のアカウントを選択
5. **Continue to summary** → **Create Token** をクリック
6. 表示されたトークンをコピー（この画面を離れると二度と表示されません）

### 2. Cloudflare アカウント ID の取得

#### 方法1: ダッシュボードから
1. https://dash.cloudflare.com/ にアクセス
2. 右側のサイドバーに **Account ID** が表示されています
3. コピーしてください

#### 方法2: wrangler コマンドから
```bash
npx wrangler whoami
```
出力される `Account ID` をコピーしてください。

### 3. GitHub Secrets の設定

#### ステップ 1: GitHub リポジトリの Settings に移動
1. GitHub リポジトリのページを開く
2. **Settings** タブをクリック
3. 左メニューから **Secrets and variables** → **Actions** を選択

#### ステップ 2: Secrets を追加
**New repository secret** をクリックして、以下の2つを追加:

##### Secret 1: CLOUDFLARE_API_TOKEN
- **Name**: `CLOUDFLARE_API_TOKEN`
- **Value**: ステップ1で取得した API トークン
- **Add secret** をクリック

##### Secret 2: CLOUDFLARE_ACCOUNT_ID
- **Name**: `CLOUDFLARE_ACCOUNT_ID`
- **Value**: ステップ2で取得した Account ID
- **Add secret** をクリック

### 4. ワークフローファイルの確認

本プロジェクトには以下の2つのワークフローファイルが存在します:

#### `.github/workflows/test.yml`
プルリクエスト時とプッシュ時にテストを実行するワークフローです。

```yaml
name: Run Tests

on:
  pull_request:
    branches:
      - main
      - master
  push:
    branches:
      - main
      - master

jobs:
  test:
    runs-on: ubuntu-latest
    name: Run Tests
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --run

      - name: Build (includes type check)
        run: npm run build
```

#### `.github/workflows/deploy.yml`
mainブランチへのプッシュ時にテストを実行し、成功後にデプロイするワークフローです。

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
      - master

jobs:
  test:
    runs-on: ubuntu-latest
    name: Run Tests
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --run

  deploy:
    runs-on: ubuntu-latest
    needs: test
    permissions:
      contents: read
      deployments: write
    name: Deploy to Cloudflare Pages
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Apply D1 Migrations
        run: npx wrangler d1 migrations apply national-flag-game-db --remote
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Deploy to Cloudflare Pages
        run: npx wrangler pages deploy dist --project-name=national-flag-game
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**注**: 
- `needs: test` により、testジョブが成功した場合のみdeployジョブが実行されます
- ビルド後、デプロイ前に自動的にD1データベースのマイグレーションが実行されます
- 最新の `wrangler pages deploy` コマンドを直接使用しており、非推奨の `wrangler pages publish` は使用していません

### 5. 動作確認

#### ステップ 1: プルリクエストの作成
```bash
# フィーチャーブランチを作成
git checkout -b feature/new-feature
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# GitHubでプルリクエストを作成
```

プルリクエストを作成すると、自動的に `Run Tests` ワークフローが実行されます:
1. GitHub リポジトリの **Pull requests** タブを開く
2. 作成したプルリクエストをクリック
3. **Checks** タブで「Run Tests」ワークフローが実行されていることを確認
4. 緑色のチェックマーク ✅ が表示されれば成功

#### ステップ 2: mainブランチへのマージ
プルリクエストをマージすると、以下が自動実行されます:
1. `Run Tests` ワークフローが実行される
2. テストが成功すると `Deploy to Cloudflare Pages` ワークフローが実行される

#### ステップ 3: デプロイを確認
1. GitHub リポジトリの **Actions** タブを開く
2. 「Deploy to Cloudflare Pages」ワークフローが実行されていることを確認
3. 緑色のチェックマーク ✅ が表示されれば成功
4. ワークフローのログに Cloudflare Pages のデプロイ URL が表示されます
5. または https://national-flag-game.pages.dev にアクセスして確認

## トラブルシューティング

### テストエラー
- ローカルで `npm test -- --run` が成功するか確認
- テストファイルに構文エラーがないか確認
- モックやフィクスチャが正しく設定されているか確認

### ビルドエラー
- ローカルで `npm run build` が成功するか確認
- `package.json` の依存関係が正しく記載されているか確認
- TypeScriptの型エラーがないか確認

### エラー: "API token is invalid"
- `CLOUDFLARE_API_TOKEN` が正しく設定されているか確認
- API トークンに正しい権限（Cloudflare Pages: Edit）が付与されているか確認

### エラー: "Account ID is invalid"
- `CLOUDFLARE_ACCOUNT_ID` が正しく設定されているか確認
- Account ID が正確にコピーされているか確認
- wrangler whoami コマンドで表示されるAccount IDと一致しているか確認

#### Account IDの確認と更新方法

```bash
# 現在のアカウント情報を確認
npx wrangler whoami

# GitHub Secretsを更新（gh CLIを使用）
gh secret set CLOUDFLARE_ACCOUNT_ID --body "your-account-id-here"
```

### エラー: "Database migration failed"
- マイグレーションファイルに構文エラーがないか確認
- ローカルで `npx wrangler d1 migrations apply national-flag-game-db --local` が成功するか確認
- D1データベースへのアクセス権限がAPIトークンに付与されているか確認
  - Cloudflare ダッシュボードでAPIトークンの権限に「D1: Edit」が含まれているか確認

### エラー: "Project not found"
- `projectName: national-flag-game` がワークフローファイルに正しく設定されているか確認
- Cloudflare Pages で同じ名前のプロジェクトが存在するか確認

### ビルドエラー
- ローカルで `npm run build` が成功するか確認
- `package.json` の依存関係が正しく記載されているか確認

## セキュリティのベストプラクティス

✅ **実施済み**:
- API トークンは GitHub Secrets で管理（暗号化保存）
- `.gitignore` に `.env` ファイルを追加済み
- `wrangler.toml` は公開しても問題ない設定のみ記載

⚠️ **注意事項**:
- API トークンを絶対にコードにハードコードしない
- API トークンをログに出力しない
- 定期的に API トークンをローテーションする

## 手動デプロイとの併用

GitHub Actions による自動デプロイを設定した後も、以下のコマンドで手動デプロイが可能です:

```bash
npm run deploy
```

ただし、自動デプロイを有効化した場合は、基本的に Git を通じてデプロイすることを推奨します。

## まとめ

この設定により、以下のワークフローが実現されます:

### プルリクエスト作成時
1. 開発者がフィーチャーブランチでコードを変更
2. プルリクエストを作成
3. GitHub Actions が自動的にテストとビルドを実行
4. テストが失敗した場合、レビュー前に問題を検出
5. テスト成功後、安全にマージ可能

### mainブランチへのマージ時
1. プルリクエストがマージされる
2. GitHub Actions がテストを実行
3. テストが成功した場合のみビルドを実行
4. D1データベースのマイグレーションを自動実行（スキーマ変更を本番環境に適用）
5. Cloudflare Pages に自動デプロイ
6. 本番環境が更新される

これにより、以下が実現されます:
- **品質保証**: mainブランチに問題のあるコードがマージされるのを防ぐ
- **手動デプロイの削減**: デプロイミスの削減
- **CI/CDパイプライン**: 自動テスト→自動デプロイの完全自動化
