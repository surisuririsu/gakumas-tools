# 学マスツール ローカルスクリプト マニュアル

`gakumas-tools` の機能をコマンドラインから手軽に実行できるツールセットです。
プロジェクトルートにある `./local-run` コマンドを通じて実行します。

## コマンド一覧

### 1. シミュレーター (`sim`)
指定した条件・メモリーでステージをシミュレーションします。

```bash
./local-run sim [シーズン-ステージ番号] [オプション]
```

**例:**
```bash
./local-run sim 37-3 --main ./main.json --sub ./sub.json --iterations 100
```
*   `--main`: メインメモリーのJSONファイル
*   `--sub`: サブメモリーのJSONファイル
*   `--iterations`: 試行回数 (推奨: 100以上)

---

### 2. メモリーダンプ (`dump`)
MongoDBから特定のPアイドルのメモリーをJSON化して保存します。

```bash
./local-run dump <pIdolId> <output_dir>
```

**例:**
```bash
./local-run dump 94 ~/output
```
※ `pIdolId` は `csv` コマンドで確認できます。

---

### 3. メモリー最適化 (`opt`)
ディレクトリ内のメモリーファイルを使って、指定ステージでの最高スコア編成（およびワースト編成）を総当たりで探索します。

```bash
./local-run opt <memories_dir> <season-stage> <num_runs>
```

**例:**
```bash
./local-run opt ~/output 37-3 100
```
*   実行結果として、**ベスト編成TOP5**、**ワースト編成TOP5**、**メモリー性能ワーストランキング**が表示されます。

---

### 4. PアイドルCSV生成 (`csv`)
Pアイドルの一覧をCSVファイル (`gakumas-tools/p_idols.csv`) として出力します。
アイドルのID (`pIdolId`) を調べるのに便利です。

```bash
./local-run csv
```

---

### 5. ステージ総合力計算 (`power`)
指定したメモリーのステージ総合力（評価値）を計算して表示します。
この数値はゲーム内のコンテスト総合力と一致します。

```bash
./local-run power <memory_file>
```

**例:**
```bash
./local-run power ~/output/memory.json
```
