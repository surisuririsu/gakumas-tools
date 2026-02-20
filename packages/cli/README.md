# Gakumas Tools CLI Utility

`gakumas-tools` の機能をより使いやすく、拡張可能にするための新しいCLIユーティリティです。
TypeScriptで実装されており、テンプレートエンジンによる柔軟な出力や Google Drive 連携などをサポートしています。

## インストール

プロジェクトのルートから `yarn cli` で実行可能です。個別に開発する場合は `packages/cli` ディレクトリで以下のコマンドを実行します。

```bash
yarn install
yarn build
```

## 使い方

以下のコマンドで実行します。

```bash
yarn cli <command> [options]
```

または、エイリアスを設定して `gakumas` コマンドなどで呼び出せるようにすることを推奨します。

```bash
alias gakumas='yarn --cwd /path/to/gakumas-tools cli'
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
    *   `idolName`: 特定のアイドルのみ計算する場合
       *  例: `saki`, `temari`, `kotone`, `tsubame`, `mao`, `lilja`, `china`, `sumika`, `hiro`, `sena`, `misuzu`, `ume`, `rinami`, `all`
    *   `plan`: 特定のプランのみ計算する場合
       *  例: `sense`, `logic`, `anomaly`
*   **オプション**:
    *   `--synth`: 合成シミュレーションを実行し、スキルカード交換の提案を行います。
    *   `--force`: キャッシュを無視して強制的に再計算を行います。
    *   `--compare <pattern>`: 特定の文字列（ワイルドカード可）を含むメモリーとの組み合わせのみを対象にします。
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

#### 3. メモリー一覧 (`list`)

保存されているメモリーの名前一覧を表示します。

```bash
gakumas list [idolName]
```

---

#### 4. レポート生成 (`dump`)

メモリーの詳細レポートを Markdown 形式で出力します。

```bash
gakumas dump [idolName] [outputFile]
```

---

#### 5. メモリー削除 (`rm`)

パターンに一致するメモリーを対話形式で削除します。

```bash
gakumas rm <pattern>
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
