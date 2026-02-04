#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { findIPAFile, extractIPAMetadata } from './ipa';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

// serveコマンド
program
  .command('serve')
  .description('IPAファイルをOTA配信するサーバーを起動')
  .option('--ipa <path>', 'IPAファイルのパス（指定しない場合は自動検出）')
  .option('--port <number>', 'ポート番号', '3000')
  .option('--bundle-id <id>', 'Bundle ID（IPAから自動取得する場合は不要）')
  .option('--app-name <name>', 'アプリ名（IPAから自動取得する場合は不要）')
  .option('--version <version>', 'バージョン（IPAから自動取得する場合は不要）')
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

      console.log(chalk.gray('\nサーバーを停止するには Ctrl+C を押してください\n'));
    } catch (error) {
      console.error(chalk.red(`❌ エラー: ${error instanceof Error ? error.message : error}`));
      process.exit(1);
    }
  });

// watchコマンド
program
  .command('watch')
  .description('ディレクトリ内の複数IPAファイルを監視してOTA配信')
  .option('--dir <path>', '監視するディレクトリ', process.cwd())
  .option('--port <number>', 'ポート番号', '3000')
  .option('--open', 'サーバー起動後にブラウザを開く', false)
  .action(async (options) => {
    try {
      console.log(chalk.cyan('🚀 Quipa Multi-App Server を起動中...'));

      const appsDirectory = path.resolve(options.dir);

      // ディレクトリの存在確認
      if (!fs.existsSync(appsDirectory)) {
        console.error(chalk.red(`❌ ディレクトリが見つかりません: ${appsDirectory}`));
        process.exit(1);
      }

      if (!fs.statSync(appsDirectory).isDirectory()) {
        console.error(chalk.red(`❌ 指定されたパスはディレクトリではありません: ${appsDirectory}`));
        process.exit(1);
      }

      console.log(chalk.gray(`監視ディレクトリ: ${appsDirectory}`));

      const { startMultiAppServer } = await import('./server');
      const port = parseInt(options.port, 10);

      console.log(chalk.gray(`HTTPサーバーを起動中... (port: ${port})`));

      const { watcher } = await startMultiAppServer({
        port,
        appsDirectory
      });

      // イベントリスナー設定
      watcher.on('add', (entry) => {
        console.log(chalk.green(`✓ アプリ追加: ${entry.metadata.appName} (${entry.slug})`));
      });

      watcher.on('remove', (entry) => {
        console.log(chalk.yellow(`- アプリ削除: ${entry.metadata.appName} (${entry.slug})`));
      });

      watcher.on('change', (entry) => {
        console.log(chalk.blue(`↻ アプリ更新: ${entry.metadata.appName} (${entry.slug})`));
      });

      watcher.on('error', (error) => {
        console.error(chalk.red(`⚠ エラー: ${error.message}`));
      });

      const baseUrl = `http://localhost:${port}`;

      console.log(chalk.green(`\n✓ サーバー起動完了！`));
      console.log(chalk.cyan('\n📱 アプリ一覧URL:'));
      console.log(chalk.white(`   ${baseUrl}`));

      const initialApps = watcher.getApps();
      if (initialApps.length > 0) {
        console.log(chalk.gray(`\n検出済みアプリ: ${initialApps.length}件`));
        initialApps.forEach(app => {
          console.log(chalk.gray(`  - ${app.metadata.appName} → ${baseUrl}/${app.slug}/`));
        });
      }

      // --openオプションでブラウザを開く
      if (options.open) {
        exec(`open ${baseUrl}`);
      }

      console.log(chalk.gray('\nサーバーを停止するには Ctrl+C を押してください'));
      console.log(chalk.gray('IPAファイルを追加/削除すると自動で反映されます\n'));
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
