const express = require('express');
const multer = require('multer');
const plist = require('plist');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { appId, version } = req.body;

    if (!appId || !version) {
      return cb(new Error('appId and version are required'));
    }

    const uploadDir = path.join(__dirname, '../uploads', appId, version);

    // Create directory if it doesn't exist
    fs.mkdirSync(uploadDir, { recursive: true });

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'app.ipa');
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept only .ipa files
    if (file.originalname.endsWith('.ipa')) {
      cb(null, true);
    } else {
      cb(new Error('Only .ipa files are allowed'));
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Generate manifest.plist for iOS OTA installation
function generateManifest(baseUrl, appId, version, bundleId, appName) {
  const ipaUrl = `${baseUrl}/uploads/${appId}/${version}/app.ipa`;

  const manifest = {
    items: [
      {
        assets: [
          {
            kind: 'software-package',
            url: ipaUrl
          }
        ],
        metadata: {
          'bundle-identifier': bundleId,
          'bundle-version': version,
          'kind': 'software',
          'title': appName
        }
      }
    ]
  };

  return plist.build(manifest);
}

// Upload endpoint
app.post('/upload', upload.single('ipa'), (req, res) => {
  try {
    const { appId, version, bundleId, appName } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!appId || !version || !bundleId || !appName) {
      return res.status(400).json({
        error: 'Missing required fields: appId, version, bundleId, appName'
      });
    }

    // Get base URL (from ngrok or localhost)
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const baseUrl = `${protocol}://${host}`;

    // Generate manifest.plist
    const manifestContent = generateManifest(baseUrl, appId, version, bundleId, appName);
    const manifestPath = path.join(__dirname, '../uploads', appId, version, 'manifest.plist');

    fs.writeFileSync(manifestPath, manifestContent);

    // Save metadata
    const metadata = {
      appId,
      version,
      bundleId,
      appName,
      uploadedAt: new Date().toISOString(),
      fileSize: req.file.size
    };

    const metadataPath = path.join(__dirname, '../uploads', appId, version, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    res.json({
      success: true,
      message: 'IPA uploaded successfully',
      data: {
        appId,
        version,
        installUrl: `${baseUrl}/install/${appId}`,
        metadata
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

// Get app metadata
app.get('/api/apps/:appId/:version', (req, res) => {
  try {
    const { appId, version } = req.params;
    const metadataPath = path.join(__dirname, '../uploads', appId, version, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ error: 'App not found' });
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    res.json(metadata);
  } catch (error) {
    console.error('Get metadata error:', error);
    res.status(500).json({ error: 'Failed to get metadata' });
  }
});

// Install page route
app.get('/install/:appId', (req, res) => {
  const { appId } = req.params;
  const version = req.query.version || 'latest';

  // Find the latest version if not specified
  let actualVersion = version;
  if (version === 'latest') {
    const appDir = path.join(__dirname, '../uploads', appId);
    if (!fs.existsSync(appDir)) {
      return res.status(404).send('App not found');
    }

    const versions = fs.readdirSync(appDir)
      .filter(v => fs.statSync(path.join(appDir, v)).isDirectory())
      .sort()
      .reverse();

    if (versions.length === 0) {
      return res.status(404).send('No versions found');
    }

    actualVersion = versions[0];
  }

  const metadataPath = path.join(__dirname, '../uploads', appId, actualVersion, 'metadata.json');

  if (!fs.existsSync(metadataPath)) {
    return res.status(404).send('Version not found');
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const baseUrl = `${protocol}://${host}`;
  const manifestUrl = `${baseUrl}/uploads/${appId}/${actualVersion}/manifest.plist`;

  res.send(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.appName} - インストール</title>
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
      color: white;
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
    <h1>${metadata.appName}</h1>
    <p class="version">Version ${metadata.version}</p>

    <div class="info">
      <div class="info-item">
        <span class="info-label">Bundle ID</span>
        <span class="info-value">${metadata.bundleId}</span>
      </div>
      <div class="info-item">
        <span class="info-label">ファイルサイズ</span>
        <span class="info-value">${(metadata.fileSize / 1024 / 1024).toFixed(2)} MB</span>
      </div>
      <div class="info-item">
        <span class="info-label">アップロード日時</span>
        <span class="info-value">${new Date(metadata.uploadedAt).toLocaleString('ja-JP')}</span>
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
  `);
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: error.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   Quipa Server Started Successfully   ║
  ╚═══════════════════════════════════════╝

  📡 Server URL: http://localhost:${PORT}

  Next steps:
  1. Start ngrok: ngrok http ${PORT}
  2. Use the ngrok HTTPS URL for uploads
  3. Upload IPA: quipa upload --app <appId> --version <version> --bundle-id <bundleId> --name "<App Name>" --ipa <path>

  `);
});
