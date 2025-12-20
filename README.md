# Quipa

iOS アプリ（IPA ファイル）を簡単に配信できる CLI ツール

IPA ファイルを置いて `quip serve` を実行するだけで、iOS デバイスにアプリを OTA（Over-The-Air）インストールできます。

## 特徴

- **ゼロコンフィグ**: IPA ファイルを自動検出し、必要な情報を自動で抽出
- **ワンコマンド**: `quip serve` だけで配信サーバーを起動

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

**注意**: iOS の OTA インストールには HTTPS が必須です。ローカル環境で配信する場合は、別途リバースプロキシや HTTPS トンネルツールを使用して HTTPS 化する必要があります。

### オプション

```bash
quip serve [options]

Options:
  --ipa <path>         IPA ファイルのパス（指定しない場合は自動検出）
  --port <number>      ポート番号 (デフォルト: 3000)
  --bundle-id <id>     Bundle ID（IPA から自動取得する場合は不要）
  --app-name <name>    アプリ名（IPA から自動取得する場合は不要）
  --version <version>  バージョン（IPA から自動取得する場合は不要）
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

- **HTTPS は必須**: HTTP ではインストールできません（別途リバースプロキシやトンネルツールで HTTPS 化が必要）
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
quip serve --ipa /path/to/your/app.ipa
```

## ライセンス

MIT

## 開発に参加する

開発者向けの情報は [DEVELOPMENT.md](./DEVELOPMENT.md) を参照してください。
