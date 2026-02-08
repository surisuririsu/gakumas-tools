# デプロイ・環境移行手順書

`gakumas-tools-cli-utility` を Raspberry Pi の Git リポジトリ経由で PC-8001 (別マシン) に展開する手順です。

## 前提条件
*   **ディレクトリ構成**: このツールは、隣接する `../gakumas-tools` ディレクトリに強く依存しています。PC-8001 上でも同じ階層関係を維持する必要があります。
    ```
    /任意のパス/
      ├─ gakumas-tools/            (コアスクリプト群: これも必要です)
      └─ gakumas-tools-cli-utility/ (本ツール)
    ```
*   **依存関係**: Node.js (v18以上推奨), Yarn または npm がインストールされていること。

## 手順 1: 現在の環境 (Mac) で Git に登録する

まだ Git リポジトリとして初期化されていないため、以下のコマンドを実行します。

```bash
cd /Users/shigehiro/gakumas-tools-cli-utility

# 1. 除外ファイルの確認 (.gitignore は作成済みです)
# node_modules, dist, .env.local などが含まれていることを確認

# 2. リポジトリの初期化とコミット
git init
git add .
git commit -m "Initial commit of CLI utility"

# 3. リモートリポジトリへの登録 (Raspberry Pi)
# ※ <user> と <ip-address> は環境に合わせて書き換えてください
# ※ 事前に RasPi 側で `git init --bare gakumas-tools-cli-utility.git` を作成しておく必要があります
git remote add origin ssh://<user>@<ip-address>/path/to/gakumas-tools-cli-utility.git

# 4. プッシュ
git push -u origin main
```

## 手順 2: PC-8001 でのセットアップ

```bash
# 1. ワークスペースへの移動
cd /path/to/workspace

# 2. gakumas-tools (コア別リポジトリ) の準備
# すでに存在する場合はスキップ。なければ RasPi から同様に clone してください。
git clone ssh://<user>@<ip-address>/path/to/gakumas-tools.git

# 3. CLI ツールの clone
git clone ssh://<user>@<ip-address>/path/to/gakumas-tools-cli-utility.git

# 4. セットアップ
cd gakumas-tools-cli-utility
npm install
npm run build

# 5. 環境変数の設定 (重要)
# .env.local は Git に含まれないため、手動で作成するかコピーします。
echo "MONGODB_URI=mongodb://<raspi-ip>:27017" > .env.local
echo "MONGODB_DB=gakumas-tools" >> .env.local

# 6. 動作確認
npm start -- contest 38-2 100 hiro
```

## トラブルシューティング
*   **Module not found**: `npm install` を実行しましたか？
*   **Script not found**: `../gakumas-tools` ディレクトリが見つからないエラーです。ディレクトリ階層を確認してください。
*   **Permission denied**: SSHキーの設定を確認してください。
