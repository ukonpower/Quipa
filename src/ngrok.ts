import ngrok from 'ngrok';

/**
 * ngrokを起動してHTTPS URLを取得
 */
export async function startNgrok(port: number): Promise<string> {
  try {
    const url = await ngrok.connect({
      addr: port,
      proto: 'http'
    });

    return url;
  } catch (error) {
    throw new Error(`ngrokの起動に失敗しました: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * ngrokを停止
 */
export async function stopNgrok(): Promise<void> {
  await ngrok.disconnect();
  await ngrok.kill();
}
