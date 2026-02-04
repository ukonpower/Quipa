# Quipa

iOS アプリ（IPA ファイル）を簡単に配信できる CLI ツール

- **単一アプリ**: `quipa serve` で IPA ファイルを即座に配信
- **複数アプリ**: `quipa watch` でディレクトリ内の IPA ファイルを監視して配信

iOS デバイスに OTA（Over-The-Air）でアプリをインストールできます。

## 特徴

- **ゼロコンフィグ**: IPA ファイルを自動検出し、必要な情報を自動で抽出
- **ワンコマンド**: `quipa serve` だけで配信サーバーを起動
- **複数アプリ対応**: `quipa watch` で複数アプリを同時ホスティング
- **ホットリロード**: ファイルの追加・削除・更新を自動検知
- **シンプル**: 複雑な設定は一切不要

## インストール

**対応環境**: macOS のみ（Apple Silicon / Intel）

### インストールスクリプト（推奨）

最新版を GitHub Releases からダウンロードしてインストール：

```bash
curl -fsSL https://raw.githubusercontent.com/ukonpower/quipa/main/install.sh | bash
```

バイナリは `~/.local/bin/quipa` にインストールされ、PATH が自動的に設定されます。

### 手動インストール

1. [Releases](https://github.com/ukonpower/quipa/releases/latest) から使用中のプラットフォームに対応した zip ファイルをダウンロード
   - Apple Silicon: `quipa-macos-apple-silicon.zip`
   - Intel Mac: `quipa-macos-intel.zip`

2. 解凍してインストール：

```bash
unzip quipa-macos-apple-silicon.zip
mkdir -p ~/.local/bin
mv quipa ~/.local/bin/
chmod +x ~/.local/bin/quipa
```

3. PATH を追加（まだ追加していない場合）：

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### アンインストール

インストールスクリプトでインストールした場合：

```bash
curl -fsSL https://raw.githubusercontent.com/ukonpower/quipa/main/uninstall.sh | bash
```

または手動で削除：

```bash
rm ~/.local/bin/quipa
```

## 使い方

Quipa には 2 つのコマンドがあります：

| コマンド | 用途 |
|---------|------|
| `quipa serve` | 単一の IPA ファイルを配信 |
| `quipa watch` | 複数の IPA ファイルを監視して配信 |

**重要**: iOS の OTA インストールには HTTPS が必須です。ローカル環境で配信する場合は、別途リバースプロキシ（Caddy、nginx など）や HTTPS トンネルツール（ngrok、Cloudflare Tunnel など）を使用して HTTPS 化する必要があります。

---

### `quipa serve` - 単一アプリの配信

1 つの IPA ファイルを配信する最もシンプルな方法です。

```bash
# カレントディレクトリの IPA ファイルを自動検出して配信
quipa serve

# 特定の IPA ファイルを指定して配信
quipa serve --ipa /path/to/MyApp.ipa

# ポート番号を指定
quipa serve --port 8080
```

#### オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `--ipa <path>` | IPA ファイルのパス | 自動検出 |
| `--port <number>` | ポート番号 | 3000 |
| `--bundle-id <id>` | Bundle ID | IPA から自動取得 |
| `--app-name <name>` | アプリ名 | IPA から自動取得 |
| `--version <version>` | バージョン | IPA から自動取得 |
| `-h, --help` | ヘルプを表示 | - |

---

### `quipa watch` - 複数アプリの配信（推奨）

ディレクトリ内の複数の IPA ファイルを監視し、アプリ一覧ページを提供します。ファイルの追加・削除・更新を自動で検知してリアルタイムに反映します。

```bash
# カレントディレクトリの IPA ファイルを監視して配信
quipa watch

# 特定のディレクトリを監視
quipa watch --dir /path/to/apps

# サーバー起動後にブラウザを自動で開く
quipa watch --open

# ポート番号を指定
quipa watch --port 8080
```

#### オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `--dir <path>` | 監視するディレクトリ | カレントディレクトリ |
| `--port <number>` | ポート番号 | 3000 |
| `--open` | サーバー起動後にブラウザを開く | false |
| `-h, --help` | ヘルプを表示 | - |

#### 機能

- **アプリ一覧ページ**: ルート URL（`http://localhost:3000`）でアプリ一覧を表示
- **個別インストールページ**: 各アプリは `/{slug}/` でアクセス可能（例: `http://localhost:3000/myapp-1.0.0/`）
- **ホットリロード**: IPA ファイルの追加・削除・更新を自動検知
- **30 秒自動更新**: アプリ一覧ページは 30 秒ごとに自動更新

#### スラッグ（URL パス）の生成規則

IPA ファイル名からスラッグが自動生成されます：

| ファイル名 | スラッグ |
|-----------|---------|
| `MyApp-1.0.0.ipa` | `myapp-1.0.0` |
| `Test App.ipa` | `test-app` |

---

### 使用例

#### 開発チームでの配信

```bash
# アプリディレクトリを作成
mkdir -p ~/ios-apps

# IPA ファイルを配置
cp MyApp-Debug.ipa ~/ios-apps/
cp MyApp-Release.ipa ~/ios-apps/

# watch モードで起動
quipa watch --dir ~/ios-apps --open

# 別ターミナルで ngrok を起動して HTTPS 化
ngrok http 3000
```

#### CI/CD での配信

```bash
# ビルド後に IPA を配置
cp $ARCHIVE_PATH/*.ipa /var/www/ios-apps/

# watch モードでサーバー起動（バックグラウンド）
quipa watch --dir /var/www/ios-apps --port 3000 &
```

## HTTPS 化について

iOS は HTTP 経由での OTA インストールを許可していないため、本番環境やデバイスからのアクセスには HTTPS が必須です。

### 推奨される方法

#### 1. ngrok を使用

```bash
# ngrokをインストール
brew install ngrok

# Quipaを起動
quipa serve

# 別のターミナルでngrokを起動
ngrok http 3000
```

ngrok が表示する HTTPS URL（例: `https://xxxx-xx-xx-xx-xx.ngrok-free.app`）を使用してデバイスからアクセスできます。

**注意**: ngrok の無料プランでは以下の制限があります：
- セッションごとに URL が変わる
- 接続時に警告ページが表示される場合がある
- 帯域幅制限がある

#### 2. HTTPS トンネルを使用（Cloudflare Tunnel）

```bash
# Cloudflare Tunnelをインストール
brew install cloudflared

# Quipaを起動
quipa serve

# 別のターミナルでトンネルを起動
cloudflared tunnel --url http://localhost:3000
```

表示された HTTPS URL を使用してデバイスからアクセスできます。

#### 3. リバースプロキシを使用（Caddy）

```bash
# Caddyをインストール
brew install caddy

# Caddyfileを作成
echo "localhost {
  reverse_proxy localhost:3000
}" > Caddyfile

# Caddyを起動
caddy run

# 別のターミナルでQuipaを起動
quipa serve
```

Caddy は自動的にローカル証明書を生成し、`https://localhost` でアクセスできるようになります。

## iOS アプリ配信の要件

Quipa を使って iOS アプリを配信するには、以下の要件を満たす必要があります：

### 証明書とプロビジョニングプロファイル

以下のいずれかが必要です：

- **Ad Hoc 配布用のプロビジョニングプロファイル**
  - テスト配布に適しています
  - デバイスの UDID を事前に Apple Developer に登録する必要があります
  - 最大 100 台まで登録可能

- **Enterprise 証明書**
  - 社内配布用
  - Apple Developer Enterprise Program への加入が必要

### アクセス要件

- **HTTPS は必須**: HTTP ではインストールできません
- **Safari ブラウザ**: Chrome や他のブラウザでは動作しません

## トラブルシューティング

### インストールボタンを押しても何も起こらない

- **HTTPS でアクセスしているか確認**
  リバースプロキシやトンネルツールを使用して HTTPS URL でアクセスしてください

- **Safari ブラウザを使用しているか確認**
  Chrome や Firefox では OTA インストールは動作しません

### 「App をインストールできません」エラー

- **プロビジョニングプロファイルを確認**
  IPA に適切なプロビジョニングプロファイルが含まれているか確認してください

- **デバイスの UDID が登録されているか確認**
  Ad Hoc 配布の場合、インストール先デバイスの UDID が Apple Developer に登録されている必要があります

### 「IPA ファイルが見つかりません」エラー

- カレントディレクトリに `.ipa` ファイルを配置してください
- または `--ipa` オプションでファイルパスを明示的に指定してください

```bash
quipa serve --ipa /path/to/your/app.ipa
```

## 開発に参加する

開発者向けの情報は [DEVELOPMENT.md](./DEVELOPMENT.md) を参照してください。

## ライセンス

MIT
