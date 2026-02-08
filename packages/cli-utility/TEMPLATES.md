# テンプレートカスタマイズガイド

`gakumas-tools-cli-utility` は Handlebars テンプレートエンジンを使用して、コマンドの実行結果を整形して表示します。
テンプレートファイルを編集することで、出力フォーマットを自由にカスタマイズできます。

## テンプレートの場所

すべてのテンプレートファイルは `src/templates/` ディレクトリに配置されています。

*   `contest.hbs`: `contest` コマンド（コンテスト最適化）の出力用
*   `stats.hbs`: `stats` コマンド（全体統計）の出力用
*   `stats-idol.hbs`: `stats` コマンド（アイドル別統計）の出力用

編集後は `npm run build` を再実行して、`dist/templates/` に変更を反映させる必要があります（または `src/templates` を直接参照するようにコードが書かれていれば不要ですが、現在の実装では `dist` 実行時に `src` を参照するか確認が必要です。現状の実装では `src/templates` を見に行っているため、再ビルドは不要なはずですが、TypeScriptのビルドプロセスによってはコピーされる可能性があります。念のため確認します）。

## データ構造

各テンプレートで利用可能なデータ構造は以下の通りです。

### 1. `opt-remote.hbs`

`opt-remote` コマンドの実行結果 (`--json` 出力) が渡されます。

```json
{
  "best": {
    "score": 12345,
    "idolName": "篠澤広",
    "mainTitle": "楽曲名",
    "subTitle": "楽曲名",
    "mainName": "メモリー名(日付+スコア)",
    "subName": "メモリー名(日付+スコア)",
    "mainFilename": "...",
    "subFilename": "..."
  },
  "topCombinations": [
    { 
      "score": 12300, 
      "mainName": "...", 
      "subName": "...",
      "min": 10000,
      "max": 14000,
      "median": 12000
    },
    ...
  ],
  "worstCombinations": [ ... ], // --showWorst 指定時
  "synthResults": [ ... ], // --synth 指定時
  "metadata": {
    "source": "...",
    "stage": 37,
    "runs": 1000,
    "idolName": "hiro",
    "plan": "logic"
  }
}
```

**使用例:**
```handlebars
# 最適化結果
ベスト編成スコア: {{best.score}}

{{#each topCombinations}}
- スコア: {{score}} ({{memories.0.title}} + {{memories.1.title}})
{{/each}}
```

### 2. `stats.hbs` (全体統計)

`stats` コマンドでアイドル指定なしの場合に使用されます。

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
    },
    ...
  ],
  "totals": {
    "sense": 100,
    "logic": 50,
    "anomaly": 20,
    "grandTotal": 170
  }
}
```

**使用例:**
```handlebars
| アイドル | 合計所持数 |
| :--- | :--- |
{{#each data}}
| {{idolName}} | {{total}} |
{{/each}}
```

### 3. `stats-idol.hbs` (アイドル別詳細)

`stats` コマンドでアイドルを指定した場合 (`gakumas stats hiro` など) に使用されます。

```json
{
  "type": "idol", // または "all_idols"
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
      },
      ...
    ]
  }
}
```

※ `all` 指定時は、この `data` オブジェクトの配列が渡されるため、ループ処理が必要になりますが、CLI側で個別にレンダリングして出力しています。

## カスタマイズの手順

1.  `src/templates/` 内の `.hbs` ファイルをテキストエディタで開きます。
2.  Markdown記法とHandlebars構文 (`{{ }}`) を使用してレイアウトを変更します。
3.  コマンドを実行して出力を確認します。

```bash
npm start -- stats
```
