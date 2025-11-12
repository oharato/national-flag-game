# GitHub Actions 自動テスト・デプロイ設定ガイド

## 概要
このガイドでは、GitHub のプルリクエスト作成時およびmain/masterブランチへのマージ時に、自動的にテストを実行し、Cloudflare Pagesへデプロイする設定方法を説明します。また、国データを定期的に更新する自動化ワークフローについても説明します。

## ワークフローの構成

本プロジェクトでは、以下の3つのGitHub Actionsワークフローを使用しています:

### 1. テストワークフロー (`.github/workflows/test.yml`)
**プルリクエスト時のみ**自動実行され、コードレビュー前に品質を確認します。

**トリガー**:
- プルリクエストがmain/masterブランチに対して作成された時（`opened`）
- プルリクエストに新しいコミットがpushされた時（`synchronize`）
- プルリクエストが再オープンされた時（`reopened`）

**実行内容**:
1. リポジトリのチェックアウト
2. Node.js 20のセットアップ
3. 依存関係のインストール (`npm ci`)
4. テストの実行 (`npm test`) - 127件のテストを実行
5. ビルド（型チェック含む） (`npm run build`)

### 2. デプロイワークフロー (`.github/workflows/deploy.yml`)
**main/masterブランチへのpush時のみ**自動実行され、テスト成功後にデプロイします。

**トリガー**:
- main/masterブランチへのpush時のみ

**実行内容**:
1. **testジョブ**: テストを実行（127件）
2. **deployジョブ**: テストが成功した後にのみ実行（`needs: test`）
   - リポジトリのチェックアウト
   - Node.js 20のセットアップ
   - 依存関係のインストール
   - ビルド
   - D1データベースのマイグレーション適用
   - Cloudflare Pagesへのデプロイ

### 3. 国データ更新ワークフロー (`.github/workflows/update-data.yml`)
**スケジュール実行または手動実行**により、国データを自動的に更新します。

**トリガー**:
- スケジュール実行: 毎週日曜日 0:00 (UTC)
- 手動実行: GitHub Actions の UI から実行可能

**実行内容**:
1. リポジトリのチェックアウト
2. Node.js 20のセットアップ
3. 依存関係のインストール
4. 国データ生成スクリプトの実行 (`npm run batch:create-data`)
5. 変更の検出と自動コミット（コミットメッセージ: "update by gha on {日時}"）
6. ビルド（変更がある場合のみ）
7. D1データベースのマイグレーション適用（変更がある場合のみ）
8. Cloudflare Pagesへのデプロイ（変更がある場合のみ）

**注意事項**:
- データ生成には最大90分のタイムアウトが設定されています
- Wikipedia と Wikidata からデータを取得するため、時間がかかる場合があります
- 変更がない場合、コミット・ビルド・デプロイはスキップされます

### ワークフローの役割分担

```
開発フロー:
1. フィーチャーブランチで開発
   └─ ローカル: pre-commitフック（format → lint → test）
2. PR作成
   └─ GitHub Actions: test.yml実行 ✓（レビュー前の品質確認）
3. 追加修正をpush
   └─ GitHub Actions: test.yml再実行 ✓（変更の品質確認）
4. コードレビュー・承認
5. PRマージ（main/masterへのpush）
   └─ GitHub Actions: deploy.yml実行
      ├─ テスト ✓（最終確認）
      ├─ D1マイグレーション
      └─ デプロイ → 本番環境更新

データ更新フロー:
1. 毎週日曜日 or 手動実行
   └─ GitHub Actions: update-data.yml実行
      ├─ 国データ生成（Wikipedia/Wikidata から取得）
      ├─ 自動コミット（"update by gha on {日時}"）
      ├─ ビルド
      └─ デプロイ → 本番環境更新
```

### テスト重複の防止

以前は`test.yml`がPR時とpush時の両方で実行されていましたが、現在は以下のように最適化されています:

- **test.yml**: PR時のみ（コードレビュー前の品質チェック）
- **deploy.yml**: main/masterへのpush時のみ（デプロイ前の最終チェック）

これにより、main/masterブランチへのpush時にテストが**1回だけ**実行され、無駄な実行を防止しています。

## ワークフローの利点

- **早期品質チェック**: PR作成時に自動テスト実行、レビュー前に問題を発見
- **効率的なレビュー**: テスト結果を確認してからコードレビューが可能
- **自動デプロイ**: mainブランチへのマージ時に自動でデプロイ
- **安全性**: テストが失敗した場合、デプロイは実行されない
- **テスト重複の防止**: main/masterへのpush時にテストは1回のみ実行
- **ブランチ保護**: GitHubのブランチ保護ルールと組み合わせることで、テスト失敗時のマージを防止
- **多層防御**: ローカルpre-commit → PR時テスト → デプロイ前テストの3段階チェック
- **データの自動更新**: 定期的または手動で国データを最新の状態に保つことが可能

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
        run: npm test

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
        run: npm test

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
        run: npx wrangler d1 migrations apply world-flags-learning-db --remote
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Deploy to Cloudflare Pages
        run: npx wrangler pages deploy dist --project-name=world-flags-learning
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**注**: 
- `needs: test` により、testジョブが成功した場合のみdeployジョブが実行されます
- ビルド後、デプロイ前に自動的にD1データベースのマイグレーションが実行されます
- 最新の `wrangler pages deploy` コマンドを直接使用しており、非推奨の `wrangler pages publish` は使用していません

#### `.github/workflows/update-data.yml`
スケジュールまたは手動で国データを更新し、自動的にコミット・デプロイするワークフローです。

```yaml
name: Update Country Data

on:
  workflow_dispatch: # 手動実行を許可
  schedule:
    - cron: '0 0 * * 0' # 毎週日曜日の0時に実行（UTC）

jobs:
  update-data:
    runs-on: ubuntu-latest
    timeout-minutes: 90 # データ生成に時間がかかるため90分のタイムアウトを設定
    permissions:
      contents: write
      deployments: write
    name: Generate and Deploy Updated Data
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate country data
        run: npm run batch:create-data
        timeout-minutes: 75 # データ生成に最大75分を許可

      - name: Get current datetime
        id: datetime
        run: echo "datetime=$(TZ='Asia/Tokyo' date +'%Y-%m-%d %H:%M:%S')" >> $GITHUB_OUTPUT

      - name: Check for changes
        id: check_changes
        run: |
          git add public/
          if git diff --staged --quiet; then
            echo "has_changes=false" >> $GITHUB_OUTPUT
            echo "No changes to commit"
          else
            echo "has_changes=true" >> $GITHUB_OUTPUT
            echo "Changes detected"
          fi

      - name: Commit and push changes
        if: steps.check_changes.outputs.has_changes == 'true'
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git commit -m "update by gha on ${{ steps.datetime.outputs.datetime }}"
          git push

      - name: Build
        if: steps.check_changes.outputs.has_changes == 'true'
        run: npm run build

      - name: Apply D1 Migrations
        if: steps.check_changes.outputs.has_changes == 'true'
        run: npx wrangler d1 migrations apply world-flags-learning-db --remote
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Deploy to Cloudflare Pages
        if: steps.check_changes.outputs.has_changes == 'true'
        run: npx wrangler pages deploy dist --project-name=world-flags-learning
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**注**: 
- データ生成は最大90分のタイムアウトが設定されています
- 変更がない場合、コミット・ビルド・デプロイはスキップされます
- コミットメッセージは日本時間（JST）の日時が自動的に追加されます
- `workflow_dispatch` により、GitHubの Actions タブから手動実行が可能です

### 5. 動作確認

#### 国データ更新ワークフローの手動実行

1. GitHub リポジトリの **Actions** タブを開く
2. 左側のワークフロー一覧から **Update Country Data** を選択
3. **Run workflow** ボタンをクリック
4. **Run workflow** を確認してクリック
5. ワークフローの実行状況を確認
   - データ生成には30分〜1時間程度かかる場合があります
   - 実行ログで進捗を確認できます
6. 完了後、`public/countries.ja.json` と `public/countries.en.json` が更新されます
7. 変更がある場合、自動的にコミット・デプロイされます

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
5. または https://world-flags-learning.pages.dev にアクセスして確認

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
- ローカルで `npx wrangler d1 migrations apply world-flags-learning-db --local` が成功するか確認
- D1データベースへのアクセス権限がAPIトークンに付与されているか確認
  - Cloudflare ダッシュボードでAPIトークンの権限に「D1: Edit」が含まれているか確認

### エラー: "Project not found"
- `projectName: world-flags-learning` がワークフローファイルに正しく設定されているか確認
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

この設定により、以下の多層防御の開発フローが実現されます:

### ローカル開発時
1. 開発者がフィーチャーブランチでコードを変更
2. `git commit` 実行
3. **pre-commitフック**が自動実行:
   - フォーマット（Biome）
   - リンター（Biome）
   - テスト（127件）
   - lint-staged
4. すべて成功した場合のみコミット可能

### プルリクエスト作成時
1. フィーチャーブランチをpush
2. GitHubでプルリクエストを作成
3. **GitHub Actions（test.yml）**が自動実行:
   - テスト（127件）
   - ビルド（型チェック含む）
4. テストが失敗した場合、**レビュー前に問題を検出**
5. テスト成功後、レビュアーは安心してコードレビュー可能

### プルリクエスト更新時
1. レビューコメントに基づいて修正
2. フィーチャーブランチに追加コミットをpush
3. **GitHub Actions（test.yml）**が再度自動実行
4. 修正内容の品質を確認

### mainブランチへのマージ時
1. プルリクエストがマージされる（main/masterへのpush）
2. **GitHub Actions（deploy.yml）**が自動実行:
   - **testジョブ**: テスト（127件）を実行（最終確認）
   - **deployジョブ**: テスト成功後のみ実行
     - ビルド
     - D1データベースのマイグレーション適用
     - Cloudflare Pagesに自動デプロイ
3. 本番環境が更新される

### 品質保証の多層構造

```
レイヤー1: ローカル（pre-commit）
  └─ 開発者のコミット時に自動チェック
  └─ 問題があるコードはコミット不可

レイヤー2: CI（test.yml）
  └─ PR作成・更新時に自動チェック
  └─ レビュー前に品質確認
  └─ テスト結果がPRページに表示

レイヤー3: CD（deploy.yml）
  └─ マージ後の最終チェック
  └─ テスト成功後のみデプロイ
  └─ 本番環境の安全性確保
```

これにより、以下が実現されます:
- **早期問題発見**: コミット時、PR作成時、デプロイ前の3段階で品質チェック
- **効率的なレビュー**: テスト済みコードのみレビュー対象
- **mainブランチの保護**: 壊れたコードがmainブランチにマージされるのを防ぐ
- **安全なデプロイ**: テストが成功した場合のみ本番環境に反映
- **手動作業の削減**: デプロイミスの削減と作業効率化
- **テスト重複の防止**: 各段階で1回ずつ、無駄なく実行
- **CI/CDパイプライン**: テスト→ビルド→デプロイの完全自動化
