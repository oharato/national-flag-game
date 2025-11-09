# API仕様書

本ドキュメントは、国旗学習アプリのバックエンドAPIの仕様を定義します。

## 1. 概要
このAPIは、クイズのスコアを記録し、ランキングを提供することを目的とします。

*   **ベースURL**: `/api`
*   **データ形式**: JSON

---

## 2. エンドポイント

### 2.1. ランキング取得 `GET /ranking`

現在のスコアランキングのリストを取得します。

*   **メソッド**: `GET`
*   **エンドポイント**: `/api/ranking`

#### リクエスト
*   **ボディ**: なし

#### レスポンス
*   **`200 OK`**: 成功した場合
    *   **Content-Type**: `application/json`
    *   **ボディ**: ランキングデータの配列。配列はスコアの高い順にソートされています。
    ```json
    {
      "ranking": [
        {
          "rank": 1,
          "nickname": "PlayerA",
          "score": 9800
        },
        {
          "rank": 2,
          "nickname": "Guest123",
          "score": 8500
        },
        {
          "rank": 3,
          "nickname": "Hero",
          "score": 7600
        }
      ]
    }
    ```

*   **`500 Internal Server Error`**: サーバー内部でエラーが発生した場合
    *   **Content-Type**: `application/json`
    *   **ボディ**:
    ```json
    {
      "error": "ランキングの取得に失敗しました。"
    }
    ```

---

### 2.2. スコア登録 `POST /ranking`

新しいスコアをランキングに登録します。同じユーザー・地域・形式の組み合わせでも、各挑戦ごとに記録されます。

*   **メソッド**: `POST`
*   **エンドポイント**: `/api/ranking`

#### リクエスト
*   **ヘッダー**:
    *   `Content-Type: application/json`
*   **ボディ**:
    ```json
    {
      "nickname": "NewPlayer",
      "score": 7700,
      "region": "Asia",
      "format": "flag-to-name"
    }
    ```
    | キー | 型 | 必須 | 説明 |
    | :--- | :--- | :--- | :--- |
    | `nickname` | string | はい | ユーザーのニックネーム。1文字以上20文字以下。 |
    | `score` | number | はい | クイズで算出されたスコア。 |
    | `region` | string | いいえ | 出題地域。デフォルト: 'all' |
    | `format` | string | いいえ | クイズ形式 ('flag-to-name' または 'name-to-flag')。デフォルト: 'flag-to-name' |


#### レスポンス
*   **`201 Created`**: 登録に成功した場合
    *   **Content-Type**: `application/json`
    *   **ボディ**: 登録されたスコアと、その時点での順位を含んだオブジェクト。
    ```json
    {
      "data": {
        "rank": 15,
        "nickname": "NewPlayer",
        "score": 7700
      },
      "message": "スコアが正常に登録されました。"
    }
    ```

*   **`400 Bad Request`**: リクエストボディの内容が不正な場合
    *   **Content-Type**: `application/json`
    *   **ボディ**:
    ```json
    {
      "error": "ニックネーム、またはスコアの形式が正しくありません。"
    }
    ```

*   **`500 Internal Server Error`**: サーバー内部でエラーが発生した場合
    *   **Content-Type**: `application/json`
    *   **ボディ**:
    ```json
    {
      "error": "スコアの登録に失敗しました。"
    }
    ```
