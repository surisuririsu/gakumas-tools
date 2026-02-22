# MongoDB スキーマドキュメント

## データベース: `gakumas` (または .env で指定された名前 デフォルト: `gakumas-tools`)

### コレクション: `memories`
Pアイドルのメモリーデータを格納します。

*   `_id`: システム生成の ObjectId
*   `pIdolId`: 数値 (Pアイドルのゲーム内ID)
*   `name`: 文字列 (ユーザー定義名。日付やステータスが含まれることが多い)
*   `...`: メモリーデータのJSONダンプ

### コレクション: `simulation_results`
コンテストシミュレーションの結果をキャッシュし、同一条件での再計算を防ぐために使用されます。

#### フィールド

| フィールド名 | 型 | 説明 |
| :--- | :--- | :--- |
| `mainHash` | String | メインメモリーの内容 (パラメータ、アイテム、スキル) から生成された SHA256 ハッシュ |
| `subHash` | String | サブメモリーの内容から生成された SHA256 ハッシュ |
| `stageId` | String | シミュレーション対象のステージID (例: `season_37_stage_3`) |
| `runs` | Number | シミュレーション試行回数 (例: `100`) |
| `season` | Number | シーズン番号 (例: `37`) |
| `score` | Number | 獲得した平均スコア |
| `min` | Number | 最小スコア |
| `max` | Number | 最大スコア |
| `median` | Number | 中央値スコア |
| `mainName` | String | メインメモリーの名前 (表示用) |
| `subName` | String | サブメモリーの名前 (表示用) |
| `mainFilename` | String | メインメモリーのファイル名、または MongoDB ID |
| `subFilename` | String | サブメモリーのファイル名、または MongoDB ID |
| `createdAt` | Date | この結果がキャッシュされた日時 |

#### インデックス (推奨)
*   複合インデックス: `{ mainHash: 1, subHash: 1, stageId: 1, runs: 1, season: 1 }` (検索用)
