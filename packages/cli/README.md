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

- `--gdrive <filename>`: 標準出力をキャプチャし、指定した名前で Google Drive にアップロードします。初回実行時には OAuth2 認証のための URL が表示されます。

---

### コマンド一覧

#### 1. コンテスト最適化 (`contest`)

MongoDB上のメモリーを使用して、指定ステージでの最適編成を探索します。

```bash
gakumas contest <stage> [runs] [idolName] [plan] [options]
```

*   **引数**:
    *   `stage`: ステージ番号 (例: `37-3`)
    *   `runs`: 1組み合わせあたりの試行回数 (デフォルト: `1000`)。省略して `idolName` を指定することも可能です (例: `gakumas contest 37-3 hiro`)。
    *   `idolName`: 特定のアイドルのみ計算する場合。カンマ区切りで複数指定可能。`all` を指定すると全アイドルを順次計算します。
        *   例: `saki`, `temari`, `kotone`, `tsubame`, `mao`, `lilja`, `china`, `sumika`, `hiro`, `sena`, `misuzu`, `ume`, `rinami`, `all`
    *   `plan`: 特定のプランのみ計算する場合 (`sense`, `logic`, `anomaly`)。省略時はステージ情報から自動設定されます。
*   **オプション**:
    *   `--synth`: 合成シミュレーションを実行し、スキルカード交換の提案を行います。
    *   `--force`: キャッシュを無視して強制的に再計算を行い、既存のキャッシュを更新します。
    *   `--compare <pattern>`: 指定したパターン（ワイルドカード `*` 使用可）に一致する名前を持つメモリーとの組み合わせのみを対象にします。
    *   `--showWorst`: 各メモリーをメインにした際の平均スコアが低い「ワースト10」も表示します。
    *   `--json`: 結果をJSON形式で出力します。

---

#### 2. メモリー統計 (`stats`)

保存されているメモリーの統計情報を表示します。

```bash
gakumas stats [idol] [options]
```

*   **引数**:
    *   `idol`: アイドル名（例: `hiro`, `saki`）。
        *   省略時: 全アイドルの所持数サマリーを表示します。
        *   `all` 指定時: 全アイドルの詳細な内訳（プラン・楽曲別）を順次表示します。
        *   名前指定時: そのアイドルの詳細な内訳を表示します。
*   **オプション**:
    *   `--json`: 結果をJSON形式で出力します。

---

#### 3. メモリー一覧 (`list`)

保存されているメモリーの名前一覧を表示します。

```bash
gakumas list [idolName]
```

*   **引数**:
    *   `idolName`: 特定のアイドルのメモリーのみ一覧表示します。

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

*   **引数**:
    *   `pattern`: 削除対象のメモリー名パターン。ワイルドカード `*` が使用可能で、内部的に正規表現に変換されます。
*   **動作**:
    *   一致する各メモリーについて、ステータスやスキルカードを表示し、削除するかどうかの確認 (`y/N`) を行います。


---

## 設定 (`.env.local`)

以下の項目を `.env.local` に設定してください。

```env
# MongoDB 接続設定
MONGODB_URI=mongodb://...
MONGODB_DB=gakumas-tools  # 省略時は URI 内のデータベースまたは "gakumas-tools" が使用されます

# Google Drive 連携設定 (オプション)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

## 開発者向け情報

*   **テンプレート**: `src/templates/` にある `.hbs` ファイルを編集することで、出力フォーマットをカスタマイズできます。詳細は [TEMPLATES.md](./TEMPLATES.md) を参照してください。
*   **スクリプト**: 実際のロジックは `scripts/` 内の `.mjs` ファイルに記述されています。
