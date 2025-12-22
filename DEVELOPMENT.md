# Quipa 開発ガイド

Quipa の開発に参加する方向けの情報です。

## プロジェクト構造

```
quipa/
├── src/
│   ├── cli.ts           # CLI エントリーポイント
│   ├── server.ts        # HTTP サーバー実装
│   ├── manifest.ts      # manifest.plist 生成
│   └── ipa.ts           # IPA 解析
├── dist/                # TypeScript ビルド出力
├── bin/                 # バイナリ出力先
│   └── macos/
│       ├── apple-silicon/
│       │   └── quipa    # Apple Silicon 用バイナリ
│       └── intel/
│           └── quipa    # Intel Mac 用バイナリ
├── package.json
└── tsconfig.json
```

## 開発環境のセットアップ

### 必要な環境

- Node.js 18 以上
- npm または yarn

### 初期セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/ukonpower/quipa.git
cd quipa

# 依存関係のインストール
npm install

# TypeScript のビルド
npm run build:ts
```

## 開発コマンド

### TypeScript のビルド

```bash
npm run build:ts
```

TypeScript ファイルを `dist/` ディレクトリにコンパイルします。

### 開発モード（Watch）

```bash
npm run dev
```

ファイルの変更を監視して自動的に再ビルドします。

### ローカルでの実行

```bash
npm start -- serve
```

または、ビルド後に直接実行：

```bash
node dist/cli.js serve
```

IPA ファイルを指定して実行：

```bash
node dist/cli.js serve --ipa /path/to/app.ipa
```

### バイナリのパッケージ化

```bash
# TypeScript のビルドとバイナリの生成
npm run build
```

このコマンドは以下を実行します：

1. TypeScript を `dist/` にコンパイル
2. macOS 用のバイナリを生成：
   - `bin/macos/apple-silicon/quipa` (Apple Silicon 用)
   - `bin/macos/intel/quipa` (Intel Mac 用)

TypeScript のみビルド：

```bash
npm run build:ts
```

バイナリのみ生成：

```bash
npm run build:binary
```

## 技術スタック

### 依存関係

- **TypeScript**: 型安全な開発
- **Express**: HTTP サーバー
- **Commander**: CLI フレームワーク
- **yauzl**: ZIP（IPA）ファイル解析
- **bplist-parser**: バイナリ plist のパース
- **plist**: plist ファイルの生成・パース
- **chalk**: ターミナル出力の装飾

### 開発依存関係

- **pkg**: Node.js アプリケーションのバイナリ化
- **@types/***: TypeScript 型定義

## アーキテクチャ

### CLI フロー

1. `cli.ts` でコマンドライン引数をパース
2. IPA ファイルの検出または指定されたパスを取得
3. `ipa.ts` で IPA ファイルからメタデータを抽出
4. `manifest.ts` で manifest.plist を生成する関数を準備
5. `server.ts` で HTTP サーバーを起動

### IPA 解析 (`ipa.ts`)

IPA ファイルから必要な情報を抽出します：

1. IPA ファイルを ZIP として開く（yauzl を使用）
2. `Payload/*.app/Info.plist` を検出
3. plist をパースして以下の情報を抽出：
   - Bundle ID (`CFBundleIdentifier`)
   - アプリ名 (`CFBundleName` または `CFBundleDisplayName`)
   - バージョン (`CFBundleShortVersionString`)
   - ビルド番号 (`CFBundleVersion`)

### manifest.plist 生成 (`manifest.ts`)

iOS の OTA インストールに必要な manifest.plist を動的に生成します。以下の情報を含みます：

- IPA ファイルの URL
- Bundle ID
- バージョン
- アプリ名

### サーバー (`server.ts`)

Express を使った HTTP サーバーで、以下のエンドポイントを提供：

- `GET /` - インストールページ（HTML）
  - アプリ情報を表示
  - インストールボタン（`itms-services://` スキーム）
  - レスポンシブデザイン
- `GET /manifest.plist` - manifest.plist の配信
  - リクエストヘッダーから URL を動的に構築
  - `x-forwarded-proto` と `x-forwarded-host` に対応（リバースプロキシ対応）
- `GET /app.ipa` - IPA ファイルのストリーム配信

## コントリビューション

### ブランチ戦略

- `main` - 安定版（リリース用）

### プルリクエスト

1. リポジトリを Fork
2. 機能ブランチを作成 (`feature/new-feature` など)
3. 変更をコミット
4. Fork にプッシュ
5. プルリクエストを作成

### コーディング規約

- TypeScript の strict モードを使用
- 意味のあるコミットメッセージを書く
- 関数やクラスには適切なコメントを追加
- エラーハンドリングを適切に実装

### コミットメッセージ

以下の形式を推奨：

```
<type>: <subject>

<body>
```

Type:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの動作に影響しない変更（フォーマットなど）
- `refactor`: リファクタリング
- `test`: テストの追加・修正
- `chore`: ビルドプロセスやツールの変更

例:
```
feat: IPAファイルの自動検出機能を追加

カレントディレクトリ内の.ipaファイルを自動検出し、
--ipaオプションを省略可能にした。
```

## テスト

現在、自動テストは未実装です。今後の課題として：

- ユニットテスト（Jest または Vitest）
- IPA ファイル解析のテスト
- サーバーエンドポイントのテスト

## リリース

### リリースプロセス

1. バージョンを更新

```bash
# package.json と cli.ts のバージョンを更新
npm version patch  # または minor, major
```

2. ビルド

```bash
npm run build
```

3. コミット & タグ

```bash
git add .
git commit -m "chore: バージョンをX.X.Xに更新"
git tag vX.X.X
git push origin main --tags
```

4. GitHub Actions が自動的にバイナリをビルドし、Release を作成

### バイナリのビルド（CI/CD）

GitHub Actions でバイナリビルドとリリースが自動化されています：

- タグがプッシュされると自動的に実行
- macOS 用のバイナリ（Apple Silicon と Intel）をビルド
- zip ファイルに圧縮して GitHub Releases にアップロード

## トラブルシューティング

### TypeScript のビルドエラー

TypeScript のバージョンを確認：

```bash
npm list typescript
```

依存関係を再インストール：

```bash
rm -rf node_modules package-lock.json
npm install
```

### バイナリが動作しない

バイナリの実行権限を確認：

```bash
chmod +x bin/macos/apple-silicon/quipa
```

pkg のバージョンを確認：

```bash
npm list pkg
```

### IPA ファイルの解析に失敗する

- IPA ファイルが破損していないか確認
- IPA ファイルが有効な ZIP ファイルとして開けるか確認：

```bash
unzip -t app.ipa
```

## その他のリソース

- [Express ドキュメント](https://expressjs.com/)
- [Commander.js ドキュメント](https://github.com/tj/commander.js)
- [pkg ドキュメント](https://github.com/vercel/pkg)
- [Apple Developer - Custom URL Schemes](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app)

## ライセンス

MIT
