import express from 'express';
import fs from 'fs';
import path from 'path';
import escapeHtml from 'escape-html';
import { generateManifest } from './manifest';
import { IPAMetadata } from './ipa';

export interface ServerOptions {
  port: number;
  metadata: IPAMetadata;
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
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(ipaPath)}"`);

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
