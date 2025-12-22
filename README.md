# Quipa

iOS アプリ（IPA ファイル）を簡単に配信できる CLI ツール

IPA ファイルを置いて `quipa serve` を実行するだけで、iOS デバイスにアプリを OTA（Over-The-Air）インストールできます。

## 特徴

- **ゼロコンフィグ**: IPA ファイルを自動検出し、必要な情報を自動で抽出
- **ワンコマンド**: `quipa serve` だけで配信サーバーを起動
- **シンプル**: 複雑な設定は一切不要

## インストール

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

### npm からインストール

```bash
npm install -g quipa
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

### 基本の使い方

1. IPA ファイルを任意のディレクトリに配置
2. そのディレクトリで `quipa serve` を実行

```bash
quipa serve
```

これだけで、以下が自動的に実行されます：

- IPA ファイルの検出
- Info.plist からメタデータ抽出（Bundle ID、アプリ名、バージョン）
- manifest.plist の自動生成
- HTTP サーバーの起動

ターミナルに表示される URL にアクセスすると、インストールページが開きます。

**重要**: iOS の OTA インストールには HTTPS が必須です。ローカル環境で配信する場合は、別途リバースプロキシ（Caddy、nginx など）や HTTPS トンネルツール（Cloudflare Tunnel、localhost.run など）を使用して HTTPS 化する必要があります。

### オプション

```bash
quipa serve [options]

Options:
  --ipa <path>         IPA ファイルのパス（指定しない場合は自動検出）
  --port <number>      ポート番号 (デフォルト: 3000)
  --bundle-id <id>     Bundle ID（IPA から自動取得する場合は不要）
  --app-name <name>    アプリ名（IPA から自動取得する場合は不要）
  --version <version>  バージョン（IPA から自動取得する場合は不要）
  -h, --help           ヘルプを表示
```

### 例

カレントディレクトリの IPA ファイルを自動検出して配信：

```bash
quipa serve
```

特定の IPA ファイルを指定して配信：

```bash
quipa serve --ipa /path/to/MyApp.ipa
```

ポート番号を指定：

```bash
quipa serve --port 8080
```

メタデータを手動で指定：

```bash
quipa serve --ipa MyApp.ipa --bundle-id com.example.app --app-name "My App" --version "1.0.0"
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
