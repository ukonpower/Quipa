# Quipa - IPA配信システム

EAS Buildで生成したIPAファイルをTestFlightを経由せずに直接配信するためのシンプルなOTA（Over-The-Air）配信システム。

## 概要

開発用ビルドを素早くチームに配信するためのローカル配信システムです。TestFlightの審査待ちを回避し、ngrok経由でHTTPS配信を行います。

## システム構成

```
quipa/
├── server/              # Express配信サーバー
│   ├── index.js        # メインサーバー
│   └── package.json
├── cli/                 # アップロードCLIツール
│   ├── upload.js
│   └── package.json
├── public/              # Webインターフェース
│   └── index.html      # ダウンロードページ
└── uploads/             # IPAファイル保存先
    └── {appId}/
        └── {version}/
            ├── app.ipa
            └── manifest.plist
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. サーバーの起動

```bash
npm run server
```

サーバーは `http://localhost:3000` で起動します。

### 3. ngrokでHTTPS化（必須）

iOSのOTAインストールはHTTPS必須のため、別のターミナルでngrokを起動します：

```bash
ngrok http 3000
```

ngrokが提供するHTTPS URL（例: `https://xxxx.ngrok-free.app`）をメモしてください。

## 使用方法

### IPAファイルのアップロード

CLIツールを使用してIPAファイルをアップロードします：

```bash
quipa upload \
  --app myapp \
  --version 1.0.0 \
  --bundle-id com.example.myapp \
  --name "My App" \
  --ipa ./build.ipa
```

### インストール

1. iOSデバイスのSafariで以下にアクセス：
   ```
   https://xxxx.ngrok-free.app/install/myapp
   ```

2. 「インストール」ボタンをタップ

3. iOSがIPAをダウンロード＆インストール

## 注意事項

### iOS配信要件

- **Ad Hoc provisioning profile** または **Enterprise証明書** が必要
- Ad Hocの場合、デバイスのUDIDを事前に登録
- **HTTPSは必須**（ngrok使用）
- **Safariからのアクセスが必要**（Chrome等では動作しない）

### セキュリティ

- 開発環境専用（本番環境では使用しない）
- ngrokの無料版はURLが起動ごとに変わる
- 固定URLが必要な場合は有料版を検討

## トラブルシューティング

- **インストールできない** → HTTPSか確認
- **証明書エラー** → provisioning profileを確認
- **ダウンロードが始まらない** → Safariを使用しているか確認

## ライセンス

MIT
