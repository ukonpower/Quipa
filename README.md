# Quipa - シンプルなIPA配信CLIツール

IPAファイルを配置して `quip serve` を実行するだけで、iOS OTA配信が可能になるシンプルなCLIツール。

## 特徴

- **ゼロコンフィグ**: IPAファイルを自動検出し、メタデータを自動抽出
- **ワンコマンド**: `quip serve` だけで起動
- **ngrok統合**: `--ngrok` オプションでHTTPS化を自動実行
- **QRコード表示**: `--qr` オプションでインストールURLをQRコードで表示

## インストール

```bash
npm install
npm run build
npm link  # グローバルにquipコマンドをインストール
```

## 使用方法

### 基本的な使い方

1. IPAファイルをプロジェクトディレクトリに配置
2. `quip serve` を実行

```bash
quip serve
```

これだけで、以下が自動的に実行されます：
- IPAファイルの検出
- Info.plistからメタデータ抽出（Bundle ID、アプリ名、バージョン）
- manifest.plistの自動生成
- HTTPサーバーの起動

### ngrokでHTTPS化（推奨）

iOS OTAインストールはHTTPS必須のため、ngrokを使用します：

```bash
quip serve --ngrok
```

ngrokが自動起動し、HTTPS URLが表示されます。

### QRコード表示

インストールURLをQRコードで表示：

```bash
quip serve --ngrok --qr
```

スマートフォンでQRコードをスキャンすると、インストールページにアクセスできます。

### オプション

```bash
quip serve [options]

Options:
  --ipa <path>         IPAファイルのパス（指定しない場合は自動検出）
  --port <number>      ポート番号 (default: 3000)
  --bundle-id <id>     Bundle ID（IPAから自動取得する場合は不要）
  --app-name <name>    アプリ名（IPAから自動取得する場合は不要）
  --version <version>  バージョン（IPAから自動取得する場合は不要）
  --ngrok              ngrokを自動起動してHTTPS化
  --qr                 インストールURLのQRコードを表示
  -h, --help           ヘルプを表示
```

## プロジェクト構造

```
quipa/
├── src/
│   ├── cli.ts           # CLIエントリーポイント
│   ├── server.ts        # HTTPサーバー実装
│   ├── manifest.ts      # manifest.plist生成
│   ├── ipa.ts           # IPA解析
│   ├── ngrok.ts         # ngrok統合
│   └── types/           # 型定義
├── dist/                # ビルド出力
└── package.json
```

## 動作要件

### iOS配信要件

- **Ad Hoc provisioning profile** または **Enterprise証明書** が必要
- Ad Hocの場合、デバイスのUDIDを事前に登録
- **HTTPSは必須**（ngrok使用推奨）
- **Safariからのアクセスが必要**（Chrome等では動作しない）

## トラブルシューティング

### インストールできない
- HTTPSでアクセスしているか確認（ngrokを使用）
- Safariブラウザでアクセスしているか確認

### 証明書エラー
- provisioning profileを確認
- デバイスのUDIDが登録されているか確認

### IPAファイルが見つからない
- カレントディレクトリに.ipaファイルを配置
- または `--ipa` オプションでパスを指定

## 開発

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# 開発モード（watch）
npm run dev
```

## ライセンス

MIT
