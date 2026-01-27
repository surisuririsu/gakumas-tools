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

### 3. メモリー最適化 (ローカル) (`opt`)
ディレクトリ内のメモリーファイルを使って、指定ステージでの最高スコア編成（およびワースト編成）を総当たりで探索します。

```bash
./local-run opt <memories_dir> <season-stage> <num_runs>
```

**例:**
```bash
./local-run opt ~/output 37-3 100
```
*   実行結果として、**ベスト編成TOP5**が表示されます。
*   オプションで `--showWorst` を指定すると **ワースト編成TOP5**、**メモリー性能ワーストランキング** も表示されます。

---

### 4. メモリー最適化 (リモート/DB) (`opt-remote`)
MongoDB上のメモリーデータを使用して、指定ステージでの最適編成を探索します。
`.env.local` に `MONGODB_URI` の設定が必要です。

```bash
./local-run opt-remote <season-stage> <num_runs> [idolName] [plan] [options]
```

**引数:**
*   `idolName`: アイドル名 (例: `rinami`, `hiro`)。`all` を指定すると全アイドルを順次実行します。
*   `plan`: プラン指定 (`sense`, `logic`, `anomaly`)。指定するとそのプランのPアイドルのみ対象になります。

**オプション:**
*   `--synth`: 最適化完了後、合成シミュレーションを実行し、スコアが向上するスキルカードの交換候補（合成候補）を提示します。
*   `--showWorst`: 低スコア（ワースト）ランキングを表示します。

**例:**
```bash
# 篠澤広のセンス編成を100回試行で最適化
./local-run opt-remote 37-3 100 hiro sense

# 全アイドルを対象に実行し、合成候補も表示
./local-run opt-remote 38-1 100 all --synth
```

---

### 5. 合成シミュレーション (`synthesis`)
指定したメイン・サブメモリーのペアに対して、所持している他のメモリーから合成（スキルカード交換）候補を探索し、スコアが向上する組み合わせを提示します。

```bash
./local-run synthesis <main_json> <sub_json> <season-stage> <num_runs>
```

**例:**
```bash
./local-run synthesis ./main.json ./sub.json 38-1 1000
```
*   探索対象は `main_json` と同じ `pIdolId` (同一アイドル・楽曲) を持つMongoDB上のメモリーです。

---

### 6. PアイドルCSV生成 (`csv`)
Pアイドルの一覧をCSVファイル (`gakumas-tools/p_idols.csv`) として出力します。
アイドルのID (`pIdolId`) を調べるのに便利です。

```bash
./local-run csv
```

---

### 7. メモリー統計 (`stats`)
所持しているメモリーの統計情報を表示します。

```bash
./local-run stats [idol] [plan]
```

*   **引数なし**: アイドルごとのプラン別所持数一覧（サマリー）を表示します。
*   **引数あり**: 指定したアイドルのメモリー詳細一覧を表示します。

**例:**
```bash
# サマリー表示
./local-run stats

# 篠澤広のメモリー詳細を表示
./local-run stats hiro

# 藤田ことねのロジックメモリー詳細を表示
./local-run stats kotone logic
```

---

### 8. ステージ総合力計算 (`power`)
指定したメモリーのステージ総合力（評価値）を計算して表示します。
この数値はゲーム内のコンテスト総合力と一致します。

```bash
./local-run power <memory_file>
```

**例:**
```bash
./local-run power ~/output/memory.json
```

---

### 既存データのメンテナンス・その他

*   **重複削除 (`diet`)**:
    MongoDB上の重複メモリー（同一内容）を削除し、最新の1件のみを残します。
    
    ```bash
    # 同一内容（6枚一致）の重複のみを削除対象として表示
    ./local-run diet
    
    # 類似検索モード: 指定した一致数以上のメモリーペアを表示（削除は行わず、確認のみ）
    # ./local-run diet <plan> <idol> [threshold]
    ./local-run diet sense hiro 5  # 5枚以上一致する広（センス）のメモリーを表示
    ./local-run diet logic all 4   # 4枚以上一致する全アイドル（ロジック）を表示
    ```

*   **名前チェック (`check-names`)**:
    アイドル名や定義の整合性をチェックします。
    ```bash
    ./local-run check-names
    ```

*   **アイコン移行 (`migrate-icons`)**:
    アイコンデータの移行処理を行います（通常は使用しません）。
    ```bash
    ./local-run migrate-icons
    ```
