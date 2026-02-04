import { EventEmitter } from 'events';
import path from 'path';
import chokidar from 'chokidar';
import { extractIPAMetadata, IPAMetadata } from './ipa';

export interface AppEntry {
  slug: string;
  metadata: IPAMetadata;
  addedAt: Date;
}

/**
 * IPAファイル名からスラッグを生成
 * 例: MyApp-1.0.0.ipa → myapp-1.0.0
 */
export function generateSlug(filename: string): string {
  return path.basename(filename, '.ipa')
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * IPAファイルを監視して自動的にアプリ一覧を管理するクラス
 */
export class IPAWatcher extends EventEmitter {
  private apps: Map<string, AppEntry> = new Map();
  private watcher: chokidar.FSWatcher | null = null;
  private directory: string;

  constructor(directory: string) {
    super();
    this.directory = path.resolve(directory);
  }

  /**
   * 監視を開始
   */
  async start(): Promise<void> {
    const pattern = path.join(this.directory, '*.ipa');

    this.watcher = chokidar.watch(pattern, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    });

    this.watcher.on('add', async (filePath) => {
      await this.handleAdd(filePath);
    });

    this.watcher.on('unlink', (filePath) => {
      this.handleRemove(filePath);
    });

    this.watcher.on('change', async (filePath) => {
      await this.handleChange(filePath);
    });

    this.watcher.on('error', (error) => {
      this.emit('error', error);
    });

    return new Promise((resolve) => {
      this.watcher!.on('ready', () => {
        this.emit('ready');
        resolve();
      });
    });
  }

  /**
   * 監視を停止
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }

  /**
   * IPAファイル追加時の処理
   */
  private async handleAdd(filePath: string): Promise<void> {
    const filename = path.basename(filePath);
    const slug = generateSlug(filename);

    try {
      const metadata = await extractIPAMetadata(filePath);
      const entry: AppEntry = {
        slug,
        metadata,
        addedAt: new Date()
      };

      this.apps.set(slug, entry);
      this.emit('add', entry);
    } catch (error) {
      this.emit('error', new Error(`Failed to parse ${filename}: ${error instanceof Error ? error.message : error}`));
    }
  }

  /**
   * IPAファイル削除時の処理
   */
  private handleRemove(filePath: string): void {
    const filename = path.basename(filePath);
    const slug = generateSlug(filename);
    const entry = this.apps.get(slug);

    if (entry) {
      this.apps.delete(slug);
      this.emit('remove', entry);
    }
  }

  /**
   * IPAファイル変更時の処理
   */
  private async handleChange(filePath: string): Promise<void> {
    this.handleRemove(filePath);
    await this.handleAdd(filePath);
    this.emit('change', this.apps.get(generateSlug(path.basename(filePath))));
  }

  /**
   * 登録済みアプリ一覧を取得
   */
  getApps(): AppEntry[] {
    return Array.from(this.apps.values()).sort((a, b) =>
      a.metadata.appName.localeCompare(b.metadata.appName)
    );
  }

  /**
   * スラッグからアプリを取得
   */
  getApp(slug: string): AppEntry | undefined {
    return this.apps.get(slug);
  }

  /**
   * 監視ディレクトリを取得
   */
  getDirectory(): string {
    return this.directory;
  }
}
