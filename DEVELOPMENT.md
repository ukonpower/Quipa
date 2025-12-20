# Quipa 開発ガイド

Quipa の開発に参加する方向けの情報です。

## プロジェクト構造

```
quipa/
├── src/
│   ├── cli.ts           # CLI エントリーポイント
│   ├── server.ts        # HTTP サーバー実装
│   ├── manifest.ts      # manifest.plist 生成
│   ├── ipa.ts           # IPA 解析
│   ├── ngrok.ts         # ngrok 統合
│   └── types/           # 型定義
├── dist/                # ビルド出力
├── bin/                 # pkg によるバイナリ出力先
└── package.json
```

## 開発環境のセットアップ

### 必要な環境

- Node.js 18 以上
- npm または yarn

### 初期セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/quipa.git
cd quipa

# 依存関係のインストール
npm install

# ビルド
npm run build

# グローバルにインストール（開発用）
npm link
```

## 開発コマンド

### ビルド

```bash
npm run build
```

TypeScript ファイルを `dist/` ディレクトリにコンパイルします。

### 開発モード（Watch）

```bash
npm run dev
```

ファイルの変更を監視して自動的に再ビルドします。

### ローカルでの実行

```bash
npm start -- serve --ngrok
```

または、ビルド後に直接実行：

```bash
node dist/cli.js serve --ngrok
```

### バイナリのパッケージ化

```bash
# すべてのプラットフォーム向け
npm run package

# macOS のみ（Intel & Apple Silicon）
npm run package:macos
```

バイナリは `bin/` ディレクトリに出力されます。

## 技術スタック

- **TypeScript**: 型安全な開発
- **Express**: HTTP サーバー
- **Commander**: CLI フレームワーク
- **ngrok**: HTTPS トンネリング
- **yauzl**: ZIP（IPA）ファイル解析
- **plist**: plist ファイルのパース
- **qrcode-terminal**: QR コード生成
- **chalk**: ターミナル出力の装飾

## アーキテクチャ

### CLI フロー

1. `cli.ts` でコマンドライン引数をパース
2. IPA ファイルの検出または指定
3. `ipa.ts` で IPA ファイルからメタデータを抽出
4. `manifest.ts` で manifest.plist を生成
5. `server.ts` で HTTP サーバーを起動
6. `--ngrok` オプションがあれば `ngrok.ts` で ngrok を起動

### IPA 解析

`ipa.ts` では以下の処理を行います：

1. IPA ファイルを ZIP として開く
2. `Payload/*.app/Info.plist` を検出
3. plist から Bundle ID、アプリ名、バージョンを抽出

### manifest.plist 生成

iOS の OTA インストールには manifest.plist が必要です。以下の情報を含みます：

- IPA ファイルの URL
- Bundle ID
- バージョン
- アプリ名

### サーバー

Express を使ったシンプルな HTTP サーバー：

- `/` - インストールページ（HTML）
- `/manifest.plist` - manifest.plist
- `/app.ipa` - IPA ファイル

## コントリビューション

### ブランチ戦略

- `main` - 安定版
- `develop` - 開発版
- `feature/*` - 新機能
- `fix/*` - バグ修正

### プルリクエスト

1. Fork してブランチを作成
2. 変更を加えてコミット
3. プルリクエストを作成

### コーディング規約

- TypeScript の strict モードを使用
- ESLint / Prettier の設定に従う
- 意味のあるコミットメッセージを書く

## テスト

現在テストは未実装です。今後の課題として：

- ユニットテスト（Jest）
- E2E テスト
- IPA ファイルの解析テスト

## リリース

1. バージョンを更新: `npm version patch|minor|major`
2. ビルド: `npm run build`
3. npm に公開: `npm publish`
4. バイナリをビルド: `npm run package`
5. GitHub Releases にバイナリを添付

## トラブルシューティング

### ビルドエラー

TypeScript のバージョンを確認してください：

```bash
npm list typescript
```

### ngrok が動作しない

ngrok のバージョンを確認：

```bash
npx ngrok version
```

## ライセンス

MIT
