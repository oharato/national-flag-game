# Pre-commit Hooks 設定ガイド

## 概要

このプロジェクトでは、コミット前に自動的にコード品質チェックとフォーマットを実行するため、Git hooksを設定しています。

## 使用ツール

- **husky**: Git hooksを簡単に管理するツール
- **lint-staged**: ステージングされたファイルに対してのみリンターを実行するツール
- **Biome**: 高速なリンター・フォーマッター

## 設定内容

### 1. huskyのインストールと初期化

```bash
npm install -D husky lint-staged
npx husky init
```

### 2. pre-commitフックの設定

`.husky/pre-commit` ファイルに以下を設定:

```bash
npx lint-staged
```

### 3. lint-stagedの設定

`package.json` に以下の設定を追加:

```json
{
  "lint-staged": {
    "*.{js,ts,vue,json,mts}": [
      "biome check --write --unsafe --no-errors-on-unmatched"
    ]
  }
}
```

### 4. Biomeの設定

`biome.json` で以下のルールを設定:

- 制御文字の正規表現チェックを無効化 (`noControlCharactersInRegex`: off)
  - セキュリティチェックで制御文字の検出に使用するため
- テストファイルからのエクスポートを許可 (`noExportsInTest`: off)
  - テストユーティリティ関数の共有のため

## 動作

### コミット時の自動実行

`git commit` を実行すると、自動的に以下の処理が実行されます:

1. ステージングされたファイル(`.js`, `.ts`, `.vue`, `.json`, `.mts`)を検出
2. Biomeでリンティングとフォーマットを実行
3. 自動修正可能な問題は修正
4. 修正されたファイルを再度ステージング
5. エラーがなければコミット完了

### エラーがある場合

エラーが検出された場合、コミットはブロックされます:

```bash
✖ biome check --write --unsafe --no-errors-on-unmatched failed to spawn:
Command failed with exit code 1
husky - pre-commit script failed (code 1)
```

エラーを修正してから再度コミットしてください。

## 成功例

```bash
$ git commit -m "feat: add new feature"
✔ Backed up original state in git stash
✔ Running tasks for staged files...
✔ Applying modifications from tasks...
✔ Cleaning up temporary files...
[main abc1234] feat: add new feature
 5 files changed, 100 insertions(+), 20 deletions(-)
```

## 手動でのリンター実行

pre-commitフック以外にも、以下のコマンドで手動実行できます:

```bash
# リンターチェックのみ
npm run lint

# 自動修正
npm run lint:fix

# フォーマットのみ
npm run format
```

## トラブルシューティング

### huskyが動作しない場合

`.husky/` ディレクトリが存在しない場合:

```bash
npx husky init
```

### pre-commitフックをスキップしたい場合

緊急時のみ、`--no-verify` オプションでスキップできます:

```bash
git commit --no-verify -m "emergency fix"
```

**注意**: 通常はスキップせず、エラーを修正してからコミットしてください。

## メリット

1. **コード品質の自動維持**: 全員が同じコードスタイルを維持
2. **レビュー負荷の軽減**: フォーマットの指摘が不要に
3. **バグの早期発見**: コミット前に潜在的な問題を検出
4. **高速実行**: Biomeの高速な処理により、ストレスなく実行可能
5. **ステージングファイルのみ対象**: 関係ないファイルは処理しない

## 注意事項

- 初回コミット時は、既存の全ファイルのフォーマットが実行される可能性があります
- 大量のファイルを変更した場合、処理に時間がかかる場合があります
- エラーが出た場合は、必ず修正してからコミットしてください
