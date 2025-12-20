import plist from 'plist';

export interface ManifestOptions {
  ipaUrl: string;
  bundleId: string;
  version: string;
  appName: string;
}

/**
 * iOS OTAインストール用のmanifest.plistを生成
 */
export function generateManifest(options: ManifestOptions): string {
  const manifest = {
    items: [
      {
        assets: [
          {
            kind: 'software-package',
            url: options.ipaUrl
          }
        ],
        metadata: {
          'bundle-identifier': options.bundleId,
          'bundle-version': options.version,
          'kind': 'software',
          'title': options.appName
        }
      }
    ]
  };

  return plist.build(manifest);
}
