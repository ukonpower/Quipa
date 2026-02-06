import express from 'express';
import fs from 'fs';
import path from 'path';
import escapeHtml from 'escape-html';
import contentDisposition from 'content-disposition';
import { generateManifest } from './manifest';
import { IPAMetadata } from './ipa';
import { IPAWatcher, AppEntry } from './watcher';

export interface ServerOptions {
  port: number;
  metadata: IPAMetadata;
}

export interface MultiAppServerOptions {
  port: number;
  appsDirectory: string;
}

/**
 * IPAファイル用のContent-Dispositionヘッダー値を生成
 * RFC 2231/5987準拠のエンコーディングを自動適用
 *
 * @param ipaPath - IPAファイルのパス
 * @returns Content-Dispositionヘッダー値
 */
function createContentDispositionHeader(ipaPath: string): string {
  const filename = path.basename(ipaPath);
  return contentDisposition(filename, {
    type: 'attachment'
  });
}

/**
 * HTTPサーバーを起動
 */
export function startServer(options: ServerOptions): Promise<express.Application> {
  return new Promise((resolve) => {
    const app = express();

    // IPAファイル配信
    app.get('/app.ipa', (req, res) => {
      const ipaPath = options.metadata.ipaPath;

      if (!fs.existsSync(ipaPath)) {
        return res.status(404).send('IPA file not found');
      }

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', createContentDispositionHeader(ipaPath));

      const stream = fs.createReadStream(ipaPath);
      stream.pipe(res);
    });

    // manifest.plist配信
    app.get('/manifest.plist', (req, res) => {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const baseUrl = `${protocol}://${host}`;

      const manifestContent = generateManifest({
        ipaUrl: `${baseUrl}/app.ipa`,
        bundleId: options.metadata.bundleId,
        version: options.metadata.version,
        appName: options.metadata.appName
      });

      res.setHeader('Content-Type', 'application/xml');
      res.send(manifestContent);
    });

    // インストールページ
    app.get('/', (req, res) => {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const baseUrl = `${protocol}://${host}`;
      const manifestUrl = `${baseUrl}/manifest.plist`;

      res.send(generateInstallPage(options.metadata, manifestUrl));
    });

    app.listen(options.port, () => {
      resolve(app);
    });
  });
}

/**
 * インストールページのHTML生成
 */
function generateInstallPage(metadata: IPAMetadata, manifestUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(metadata.appName)} - インストール</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .icon {
      width: 120px;
      height: 120px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 25px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 60px;
    }

    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }

    .version {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
      font-size: 16px;
    }

    .info {
      background: #f7f7f7;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 30px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-label {
      color: #666;
      font-weight: 500;
    }

    .info-value {
      color: #333;
    }

    .install-btn {
      display: block;
      width: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 18px;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      text-decoration: none;
      text-align: center;
    }

    .install-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }

    .install-btn:active {
      transform: translateY(0);
    }

    .warning {
      margin-top: 20px;
      padding: 15px;
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      border-radius: 5px;
      font-size: 14px;
      color: #856404;
    }

    .warning strong {
      display: block;
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📱</div>
    <h1>${escapeHtml(metadata.appName)}</h1>
    <p class="version">Version ${escapeHtml(metadata.version)} (${escapeHtml(metadata.buildNumber)})</p>

    <div class="info">
      <div class="info-item">
        <span class="info-label">Bundle ID</span>
        <span class="info-value">${escapeHtml(metadata.bundleId)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Version</span>
        <span class="info-value">${escapeHtml(metadata.version)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Build</span>
        <span class="info-value">${escapeHtml(metadata.buildNumber)}</span>
      </div>
    </div>

    <a href="itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}" class="install-btn">
      インストール
    </a>

    <div class="warning">
      <strong>注意事項</strong>
      このアプリをインストールするには、Safariブラウザを使用してください。
      インストール後、「設定」→「一般」→「VPNとデバイス管理」から証明書を信頼する必要がある場合があります。
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 複数アプリ対応HTTPサーバーを起動
 */
export function startMultiAppServer(options: MultiAppServerOptions): Promise<{ app: express.Application; watcher: IPAWatcher }> {
  return new Promise(async (resolve) => {
    const app = express();
    const watcher = new IPAWatcher(options.appsDirectory);

    // アプリ一覧ページ
    app.get('/', (req, res) => {
      const apps = watcher.getApps();
      res.send(generateAppListPage(apps));
    });

    // 個別アプリのインストールページ
    app.get('/:slug/', (req, res) => {
      const appEntry = watcher.getApp(req.params.slug);
      if (!appEntry) {
        return res.status(404).send(generate404Page());
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const baseUrl = `${protocol}://${host}`;
      const manifestUrl = `${baseUrl}/${req.params.slug}/manifest.plist`;

      res.send(generateInstallPage(appEntry.metadata, manifestUrl));
    });

    // 個別アプリのmanifest.plist
    app.get('/:slug/manifest.plist', (req, res) => {
      const appEntry = watcher.getApp(req.params.slug);
      if (!appEntry) {
        return res.status(404).send('App not found');
      }

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const baseUrl = `${protocol}://${host}`;

      const manifestContent = generateManifest({
        ipaUrl: `${baseUrl}/${req.params.slug}/app.ipa`,
        bundleId: appEntry.metadata.bundleId,
        version: appEntry.metadata.version,
        appName: appEntry.metadata.appName
      });

      res.setHeader('Content-Type', 'application/xml');
      res.send(manifestContent);
    });

    // 個別アプリのIPA配信
    app.get('/:slug/app.ipa', (req, res) => {
      const appEntry = watcher.getApp(req.params.slug);
      if (!appEntry) {
        return res.status(404).send('App not found');
      }

      const ipaPath = appEntry.metadata.ipaPath;
      if (!fs.existsSync(ipaPath)) {
        return res.status(404).send('IPA file not found');
      }

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', createContentDispositionHeader(ipaPath));

      const stream = fs.createReadStream(ipaPath);
      stream.pipe(res);
    });

    // watcherを開始
    await watcher.start();

    app.listen(options.port, () => {
      resolve({ app, watcher });
    });
  });
}

/**
 * アプリ一覧ページのHTML生成
 */
function generateAppListPage(apps: AppEntry[]): string {
  const appCards = apps.map(app => `
    <a href="/${escapeHtml(app.slug)}/" class="app-card">
      <div class="app-icon">📱</div>
      <div class="app-info">
        <h2>${escapeHtml(app.metadata.appName)}</h2>
        <p class="app-version">v${escapeHtml(app.metadata.version)} (${escapeHtml(app.metadata.buildNumber)})</p>
        <p class="app-bundle">${escapeHtml(app.metadata.bundleId)}</p>
      </div>
    </a>
  `).join('');

  const emptyMessage = apps.length === 0 ? `
    <div class="empty-message">
      <p>IPAファイルがありません</p>
      <p class="hint">監視ディレクトリに.ipaファイルを配置してください</p>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="30">
  <title>Quipa - アプリ一覧</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      margin-bottom: 40px;
    }

    header h1 {
      color: white;
      font-size: 32px;
      margin-bottom: 10px;
    }

    header p {
      color: rgba(255, 255, 255, 0.8);
      font-size: 16px;
    }

    .app-count {
      background: rgba(255, 255, 255, 0.2);
      padding: 5px 15px;
      border-radius: 20px;
      display: inline-block;
      margin-top: 10px;
      color: white;
      font-size: 14px;
    }

    .app-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .app-card {
      background: white;
      border-radius: 15px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 20px;
      text-decoration: none;
      color: inherit;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .app-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
    }

    .app-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40px;
      flex-shrink: 0;
    }

    .app-info {
      flex: 1;
      min-width: 0;
    }

    .app-info h2 {
      font-size: 20px;
      color: #333;
      margin-bottom: 5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .app-version {
      font-size: 14px;
      color: #666;
      margin-bottom: 3px;
    }

    .app-bundle {
      font-size: 12px;
      color: #999;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .empty-message {
      background: white;
      border-radius: 15px;
      padding: 60px 20px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .empty-message p {
      font-size: 18px;
      color: #666;
    }

    .empty-message .hint {
      font-size: 14px;
      color: #999;
      margin-top: 10px;
    }

    footer {
      text-align: center;
      margin-top: 40px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Quipa</h1>
      <p>iOS OTA 配信サーバー</p>
      <span class="app-count">${apps.length} アプリ</span>
    </header>

    <div class="app-list">
      ${appCards}
      ${emptyMessage}
    </div>

    <footer>
      <p>30秒ごとに自動更新 | Safariでアクセスしてください</p>
    </footer>
  </div>
</body>
</html>
  `;
}

/**
 * 404ページのHTML生成
 */
function generate404Page(): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>アプリが見つかりません</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    h1 {
      font-size: 72px;
      color: #764ba2;
      margin-bottom: 10px;
    }

    p {
      color: #666;
      margin-bottom: 20px;
    }

    a {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 30px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
    }

    a:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>アプリが見つかりません</p>
    <a href="/">アプリ一覧に戻る</a>
  </div>
</body>
</html>
  `;
}
