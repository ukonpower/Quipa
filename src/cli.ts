#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { findIPAFile, extractIPAMetadata } from './ipa';
import path from 'path';

// serveコマンド
program
  .command('serve')
  .description('IPAファイルをOTA配信するサーバーを起動')
  .option('--ipa <path>', 'IPAファイルのパス（指定しない場合は自動検出）')
  .option('--port <number>', 'ポート番号', '3000')
  .option('--bundle-id <id>', 'Bundle ID（IPAから自動取得する場合は不要）')
  .option('--app-name <name>', 'アプリ名（IPAから自動取得する場合は不要）')
  .option('--version <version>', 'バージョン（IPAから自動取得する場合は不要）')
  .option('--qr', 'インストールURLのQRコードを表示')
  .action(async (options) => {
    try {
      console.log(chalk.cyan('🚀 Quipa Server を起動中...'));

      // IPAファイルの検出
      let ipaPath = options.ipa;
      if (!ipaPath) {
        console.log(chalk.gray('IPAファイルを検出中...'));
        ipaPath = await findIPAFile();

        if (!ipaPath) {
          console.error(chalk.red('❌ IPAファイルが見つかりませんでした'));
          console.log(chalk.yellow('カレントディレクトリに.ipaファイルを配置するか、--ipaオプションで指定してください'));
          process.exit(1);
        }

        console.log(chalk.green(`✓ IPAファイルを検出: ${path.basename(ipaPath)}`));
      }

      // メタデータの抽出
      console.log(chalk.gray('IPAファイルからメタデータを読み取り中...'));
      const metadata = await extractIPAMetadata(ipaPath);

      // オプションで上書き（指定されている場合）
      const finalMetadata = {
        bundleId: options.bundleId || metadata.bundleId,
        appName: options.appName || metadata.appName,
        version: options.version || metadata.version,
        buildNumber: metadata.buildNumber,
        ipaPath
      };

      console.log(chalk.green('\n✓ メタデータ取得完了:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.white(`Bundle ID:    ${finalMetadata.bundleId}`));
      console.log(chalk.white(`App Name:     ${finalMetadata.appName}`));
      console.log(chalk.white(`Version:      ${finalMetadata.version}`));
      console.log(chalk.white(`Build Number: ${finalMetadata.buildNumber}`));
      console.log(chalk.gray('─'.repeat(50)));

      // サーバー起動
      const { startServer } = await import('./server');
      const port = parseInt(options.port, 10);

      console.log(chalk.gray(`\nHTTPサーバーを起動中... (port: ${port})`));

      const baseUrl = `http://localhost:${port}`;

      await startServer({
        port,
        metadata: finalMetadata
      });

      console.log(chalk.green(`\n✓ サーバー起動完了！`));
      console.log(chalk.cyan('\n📱 インストールURL:'));
      console.log(chalk.white(`   ${baseUrl}`));

      // QRコード表示（オプション指定時）
      if (options.qr) {
        const qrcode = await import('qrcode-terminal');
        console.log(chalk.cyan('\n📱 QRコード:'));
        qrcode.generate(baseUrl, { small: true });
      }

      console.log(chalk.gray('\nサーバーを停止するには Ctrl+C を押してください\n'));
    } catch (error) {
      console.error(chalk.red(`❌ エラー: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  });

program
  .name('quip')
  .description('シンプルなIPA配信CLIツール')
  .version('2.0.0');

program.parse();
