# テンプレートカスタマイズガイド

`gakumas-cli` は Handlebars テンプレートエンジンを使用して、コマンドの実行結果を整形して表示します。
テンプレートファイルを編集することで、出力フォーマットを自由にカスタマイズできます。

## テンプレートの場所

すべてのテンプレートファイルは `src/templates/` ディレクトリに配置されています。

*   `contest.hbs`: `contest` コマンド（コンテスト最適化）の出力用
*   `stats.hbs`: `stats` コマンド（全体統計）の出力用
*   `stats-idol.hbs`: `stats` コマンド（アイドル別詳細統計）の出力用

編集後は `yarn build` を再実行して、`dist/templates/` に変更を反映させる必要があります。

## データ構造

各テンプレートで利用可能なデータ構造は以下の通りです。

### 1. `contest.hbs`

`contest` コマンドの実行結果が渡されます。

```json
{
  "best": {
    "score": 12345,
    "idolName": "篠澤広",
    "mainTitle": "楽曲名",
    "subTitle": "楽曲名",
    "mainName": "メモリー名",
    "subName": "メモリー名",
    "mainFilename": "...",
    "subFilename": "..."
  },
  "topCombinations": [
    {
      "mainName": "...",
      "subName": "...",
      "score": 12300,
      "min": 10000,
      "max": 14000,
      "median": 12000
    }
  ],
  "worstCombinations": [
    {
      "score": 11000,
      "mainName": "...",
      "subName": "",
      "amount": 10
    }
  ],
  "synthResults": [
    {
      "score": 12500,
      "diff": 155,
      "startScore": 12345,
      "newScore": 12500,
      "result": {
        "memories": ["元のカード名", "新しいカード名"]
      },
      "meta": {
        "slot": 0,
        "originalName": "...",
        "newName": "..."
      }
    }
  ],
  "isCompare": false, // --compare 指定時に true
  "comparePattern": "*",
  "compareResults": [ ... ],
  "metadata": {
    "source": "...",
    "stage": "37-3",
    "runs": 1000,
    "idolName": "hiro",
    "plan": "logic"
  }
}
```

**使用例:**
```handlebars
# 最適化結果: {{best.idolName}}
ベストスコア: {{best.score}}

## トップ組み合わせ
{{#each topCombinations}}
- {{mainName}} + {{subName}}: {{score}}
{{/each}}
```

### 2. `stats.hbs` (全体統計)

`stats` コマンドで引数なしの場合に使用されます。

```json
{
  "type": "overall",
  "data": [
    {
      "idolName": "花海 咲季",
      "sense": 10,
      "logic": 5,
      "anomaly": 0,
      "total": 15
    }
  ],
  "totals": {
    "sense": 100,
    "logic": 50,
    "anomaly": 20,
    "grandTotal": 170
  }
}
```

### 3. `stats-idol.hbs` (アイドル別詳細)

`stats <idolName>` または `stats all` コマンドで使用されます。
いずれの場合も、テンプレートには以下の `data` プロパティを持つオブジェクトが渡されます。

```json
{
  "data": {
    "idolName": "篠澤 広",
    "total": 43,
    "breakdown": [
      {
        "plan": "sense",
        "planName": "センス",
        "title": "光景",
        "count": 3,
        "percent": "7.0"
      }
    ]
  }
}
```

## カスタマイズの手順

1.  `src/templates/` 内の `.hbs` ファイルを編集します。
2.  `yarn build` を実行してコンパイルします。
3.  コマンドを実行して出力を確認します。

```bash
yarn cli stats
```
