# Quipa

iOS アプリ（IPA ファイル）を簡単に配信できる CLI ツール

IPA ファイルを置いて `quip serve` を実行するだけで、iOS デバイスにアプリを OTA（Over-The-Air）インストールできます。

## 特徴

- **ゼロコンフィグ**: IPA ファイルを自動検出し、必要な情報を自動で抽出
- **ワンコマンド**: `quip serve` だけで配信サーバーを起動
- **ngrok 統合**: `--ngrok` オプションで HTTPS 化を自動実行
- **QR コード表示**: `--qr` オプションでインストール URL を QR コード表示

## インストール

```bash
npm install -g quipa
```

または、ソースからビルドする場合：

```bash
git clone https://github.com/yourusername/quipa.git
cd quipa
npm install
npm run build
npm link
```

## 使い方

### 基本の使い方

1. IPA ファイルを任意のディレクトリに配置
2. そのディレクトリで `quip serve` を実行

```bash
quip serve
```

これだけで、以下が自動的に実行されます：
- IPA ファイルの検出
- Info.plist からメタデータ抽出（Bundle ID、アプリ名、バージョン）
- manifest.plist の自動生成
- HTTP サーバーの起動

ターミナルに表示される URL にアクセスすると、インストールページが開きます。

### HTTPS 化（推奨）

iOS の OTA インストールは HTTPS が必須です。ngrok を使って簡単に HTTPS 化できます：

```bash
quip serve --ngrok
```

ngrok が自動起動し、HTTPS URL が表示されます。この URL を iOS デバイスの Safari で開いてください。

### QR コード表示

インストール URL を QR コードで表示できます：

```bash
quip serve --ngrok --qr
```

ターミナルに表示される QR コードをスマートフォンでスキャンすると、インストールページに直接アクセスできます。

### オプション

```bash
quip serve [options]

Options:
  --ipa <path>         IPA ファイルのパス（指定しない場合は自動検出）
  --port <number>      ポート番号 (デフォルト: 3000)
  --bundle-id <id>     Bundle ID（IPA から自動取得する場合は不要）
  --app-name <name>    アプリ名（IPA から自動取得する場合は不要）
  --version <version>  バージョン（IPA から自動取得する場合は不要）
  --ngrok              ngrok を自動起動して HTTPS 化
  --qr                 インストール URL の QR コードを表示
  -h, --help           ヘルプを表示
```

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

- **HTTPS は必須**: HTTP ではインストールできません（`--ngrok` オプション推奨）
- **Safari ブラウザ**: Chrome や他のブラウザでは動作しません

## トラブルシューティング

### インストールボタンを押しても何も起こらない

- **HTTPS でアクセスしているか確認**
  `--ngrok` オプションを使用して HTTPS URL でアクセスしてください

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
quip serve --ipa /path/to/your/app.ipa --ngrok
```

### ngrok が起動しない

- ngrok がインストールされているか確認してください
- ngrok の認証トークンが設定されているか確認してください

詳細は [ngrok のドキュメント](https://ngrok.com/docs)を参照してください。

## ライセンス

MIT

## 開発に参加する

開発者向けの情報は [DEVELOPMENT.md](./DEVELOPMENT.md) を参照してください。
