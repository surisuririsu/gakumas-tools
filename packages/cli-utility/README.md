# Gakumas Tools CLI Utility

`gakumas-tools` の機能をより使いやすく、拡張可能にするための新しいCLIユーティリティです。
従来の `local-run` スクリプトに代わるもので、TypeScriptで実装されており、テンプレートエンジンによる柔軟な出力や Google Drive 連携などをサポートしています。

## インストール

プロジェクトのルートディレクトリ（`gakumas-tools-cli-utility`）で以下のコマンドを実行し、依存関係をインストールしてビルドします。

```bash
npm install
npm run build
```

## 使い方

以下のコマンドで実行します。

```bash
npm start -- <command> [options]
```

または、エイリアスを設定して `gakumas` コマンドなどで呼び出せるようにすることを推奨します。

```bash
alias gakumas='npm start --prefix /path/to/gakumas-tools-cli-utility --'
```

### グローバルオプション

- `--gdrive <filename>`: 標準出力をキャプチャし、指定した名前で Google Drive にアップロードします。(`.env.local` の設定が必要)

---

### コマンド一覧

#### 1. コンテスト最適化 (`contest`)

MongoDB上のメモリーを使用して、指定ステージでの最適編成を探索します。
(旧 `opt-remote` コマンド)

```bash
gakumas contest <stage> [runs] [idolName] [plan] [options]
```

*   **引数**:
    *   `stage`: ステージ番号 (例: `37-3`)
    *   `runs`: 1組み合わせあたりの試行回数 (デフォルト: 1000)
    *   `idolName`: 特定のアイドルのみ計算する場合 (例: `hiro`, `all`)
    *   `plan`: 特定のプランのみ計算する場合 (例: `anomaly`)
*   **オプション**:
    *   `--synth`: 合成シミュレーションを実行し、スキルカード交換の提案を行います。
    *   `--showWorst`: ワースト編成も表示します。
    *   `--json`: 結果をJSON形式で出力します。

---

#### 2. メモリー統計 (`stats`)

所持しているメモリーの統計情報を表示します。

```bash
gakumas stats [idol] [plan] [options]
```

*   **引数**:
    *   `idol`: アイドル名。省略時は全アイドルのサマリーを表示。
    *   `plan`: プラン名名。
*   **オプション**:
    *   `--json`: 結果をJSON形式で出力します。

---

#### 3. アイドル道シミュレータ (`idol-road`)

MongoDBからロードしたメモリーを使用して、対話形式でアイドル道のシミュレーションを行います。

```bash
gakumas idol-road [memoryId]
```

*   **引数**:
    *   `memoryId`: メモリーのオブジェクトID。省略した場合は最近のメモリー一覧を表示します。

---

#### 4. メモリー一覧 (`list`)

保存されているメモリーの名前一覧を表示します。

```bash
gakumas list [idolName]
```

---

#### 5. レポート生成 (`dump`)

メモリーの詳細レポートを Markdown 形式で出力します。

```bash
gakumas dump [idolName] [outputFile]
```

---

#### 6. 重複整理 (`diet`)

MongoDB上の重複・類似メモリーを整理します。

```bash
gakumas diet [plan] [idol] [threshold]
```

---

#### 7. シミュレーション (`sim`)

ローカルのJSON形式のメモリーファイルを使用してシミュレーションを実行します。

```bash
gakumas sim <seasonStage> [options]
```

---

## 設定 (`.env.local`)

以下の項目を `.env.local` に設定してください。

```env
MONGODB_URI=mongodb://...
GDRIVE_SERVICE_ACCOUNT_JSON=./path/to/service-account.json
GDRIVE_FOLDER_ID=your-folder-id
```

## 開発者向け情報

*   **テンプレート**: `src/templates/` にある `.hbs` ファイルを編集することで、出力フォーマットをカスタマイズできます。
*   **高度なアイドル道シミュレーション**: `gakumas-engine` を使用した精緻なシミュレーションは `src/idol-road/interactive.ts` を直接実行することで利用可能です。
