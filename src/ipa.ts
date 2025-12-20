import fs from 'fs';
import path from 'path';
import yauzl from 'yauzl';
import plist from 'plist';

export interface IPAMetadata {
  bundleId: string;
  appName: string;
  version: string;
  buildNumber: string;
  ipaPath: string;
}

/**
 * カレントディレクトリからIPAファイルを検出
 */
export async function findIPAFile(directory: string = process.cwd()): Promise<string | null> {
  const files = fs.readdirSync(directory);
  const ipaFiles = files.filter(file => file.endsWith('.ipa'));

  if (ipaFiles.length === 0) {
    return null;
  }

  if (ipaFiles.length > 1) {
    console.warn(`複数のIPAファイルが見つかりました。最初のファイルを使用: ${ipaFiles[0]}`);
  }

  return path.join(directory, ipaFiles[0]);
}

/**
 * IPAファイルからInfo.plistを抽出してメタデータを読み取る
 */
export async function extractIPAMetadata(ipaPath: string): Promise<IPAMetadata> {
  return new Promise((resolve, reject) => {
    yauzl.open(ipaPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        return reject(new Error(`IPAファイルを開けませんでした: ${err.message}`));
      }

      if (!zipfile) {
        return reject(new Error('IPAファイルが不正です'));
      }

      let infoPlistFound = false;

      zipfile.readEntry();

      zipfile.on('entry', (entry: yauzl.Entry) => {
        // Payload/xxx.app/Info.plist を探す
        if (entry.fileName.match(/^Payload\/[^\/]+\.app\/Info\.plist$/)) {
          infoPlistFound = true;

          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) {
              zipfile.close();
              return reject(new Error(`Info.plistの読み取りに失敗: ${err.message}`));
            }

            if (!readStream) {
              zipfile.close();
              return reject(new Error('Info.plistのストリームを開けませんでした'));
            }

            const chunks: Buffer[] = [];

            readStream.on('data', (chunk) => {
              chunks.push(chunk);
            });

            readStream.on('end', () => {
              try {
                const plistContent = Buffer.concat(chunks).toString('utf8');
                const parsed = plist.parse(plistContent) as any;

                const metadata: IPAMetadata = {
                  bundleId: parsed.CFBundleIdentifier || '',
                  appName: parsed.CFBundleDisplayName || parsed.CFBundleName || '',
                  version: parsed.CFBundleShortVersionString || '',
                  buildNumber: parsed.CFBundleVersion || '',
                  ipaPath
                };

                zipfile.close();
                resolve(metadata);
              } catch (error) {
                zipfile.close();
                reject(new Error(`Info.plistのパースに失敗: ${error}`));
              }
            });

            readStream.on('error', (error) => {
              zipfile.close();
              reject(new Error(`Info.plistの読み取りエラー: ${error.message}`));
            });
          });
        } else {
          zipfile.readEntry();
        }
      });

      zipfile.on('end', () => {
        if (!infoPlistFound) {
          reject(new Error('Info.plistが見つかりませんでした'));
        }
      });

      zipfile.on('error', (error) => {
        reject(new Error(`ZIPファイルの読み取りエラー: ${error.message}`));
      });
    });
  });
}
