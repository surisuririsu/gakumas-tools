# Developer Log & Knowledge Base

このドキュメントは、Geminiとの開発プロセスで得られた知見、重要なコマンド仕様、およびトラブルシューティング情報をまとめたものです。

## 1. コマンドラインツール (`local-run`) の主要機能

### メモリーダンプ (`dump`)

MongoDBからPアイドルのメモリーデータを抽出し、JSONファイルとして保存します。

**基本使用法:**
```bash
./local-run dump [pIdolId] [output_dir] [options]
```

**フィルタリングオプション:**
特定の条件に合致するメモリーのみを抽出できます。

- `--idolName <name>`: アイドル名でフィルタ (部分一致サポートの場合あり)
    - 例: `rinami` (藤田ことね)
- `--plan <plan_type>`: プロデュースプランでフィルタ
    - 値: `sense`, `logic`, `anomaly`

**実行例:**
```bash
# 藤田ことね (id: 1) のセンス (sense) プランのメモリーのみダンプ
./local-run dump 1 ~/output --idolName rinami --plan sense
```

---

## 2. インフラ・環境設定

### MongoDB 接続トラブルシューティング

Mac mini から Raspberry Pi 上の Docker コンテナとして稼働している MongoDB に接続する際の注意点。

**問題:** `ECONNREFUSED` エラーが発生する。
**原因:**
1.  Docker コンテナのポートマッピングが正しく外部に公開されていない。
2.  `.env.local` などの環境変数ファイルで接続先ホストが `localhost` のままになっている。

**解決策:**
1.  **Docker Compose 設定確認:** `docker-compose.yml` でポート `27017` がホスト側に公開されていることを確認。
2.  **環境変数確認:** プロジェクトルートの `.env.local` で `MONGODB_URI` を Raspberry Pi の IP アドレスに設定する。
    ```
    MONGODB_URI=mongodb://[raspberry-pi-ip]:27017/gakumas
    ```

---

## 3. スクリプト同期ワークフロー

メインの開発環境 (Mac mini) と実行環境 (Raspberry Pi) 間でスクリプトを同期する手順。

**主要スクリプト:**
- `optimize-memories-parallel.mjs`: 並列処理によるメモリー最適化
- `optimize-worker.mjs`: ワーカープロセス
- `dump-memories.mjs`: ダンプ処理ロジック

**同期コマンド例 (`scp`):**

```bash
# Mac mini 上で実行
scp ./local-scripts/*.mjs [user]@[raspberry-pi-ip]:~/gakumas-tools/local-scripts/
```

---

## 4. スクリプト詳細

### メモリー最適化 (`optimize-memories-parallel.mjs`)

大量のメモリーの組み合わせから、指定されたステージでの理論上の最高スコアを探索します。

- **並列処理:** Node.js の `worker_threads` を使用して全CPUコアを活用。
- **入力:** 
    - メモリーJSONファイル群が含まれるディレクトリ
    - **[NEW]** MongoDB Connection URI (`mongodb://...`)
- **出力:** スコア上位/下位の編成、およびメモリー単体の性能評価。

### MongoDB 直接参照による最適化

Mac mini から Raspberry Pi 上の MongoDB に直接接続して最適化を実行する場合のコマンド例。

```bash
# 基本形
./local-run opt mongodb://[raspberry-pi-ip]:27017/gakumas-tools 37-3 100

# フィルタリングあり (例: 藤田ことね (rinami) のセンス (sense) プラン)
./local-run opt mongodb://192.168.100.23:27017/gakumas-tools 37-3 100 --idolName rinami --plan sense

# 複数アイドル指定 (カンマ区切り)
./local-run opt mongodb://192.168.100.23:27017/gakumas-tools 37-3 100 --idolName china,kotone --plan logic
```

### 簡易コマンド (`opt-remote`)

`.env.local` の設定 (`MONGODB_URI` + `MONGODB_DB`) を使用して、IP等の入力を省略できるショートカットコマンドです。

```bash
# ./local-run opt-remote <stage> <runs> <idolName> <plan>
./local-run opt-remote 37-3 10 rinami sense
```

---

## 5. 推奨ワークフロー

**CLIによるスクリーニング → GUIによる精密シミュレーション**

1.  **スクリーニング (CLI)**:
    -   `local-run opt-remote` を使用。
    -   試行回数 (`n`) は **10回程度** とし、高速に候補を絞り込む。
    -   スコア上位のメモリー組み合わせを特定する。
2.  **本番シミュレーション (GUI)**:
    -   特定したメモリーを使用して、Web UI上で実行。
    -   試行回数を **2000回** など十分な数に設定し、正確な期待値を算出する。

**必要な引数:**
1.  **Source**: `mongodb://` から始まるURI。
2.  **Stage**: シーズン-ステージ番号 (例: `37-3`)。
3.  **NumRuns**: 試行回数 (例: `100`)。

**オプション (DBモード専用):**
-   `--idolName <name>`: アイドル名 (例: `rinami`, `saki`...)
-   `--plan <type>`: `sense` | `logic` | `anomaly`


---

**最終更新:** 2026-01-09
