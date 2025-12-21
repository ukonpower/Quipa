#!/bin/bash

set -e

# 色の定義
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Quipa インストールスクリプト"
echo ""

# アーキテクチャを検出
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    BINARY_DIR="arm64"
elif [ "$ARCH" = "x86_64" ]; then
    BINARY_DIR="x64"
else
    echo -e "${RED}❌ サポートされていないアーキテクチャ: $ARCH${NC}"
    exit 1
fi

# スクリプトのディレクトリを取得
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BINARY_PATH="$SCRIPT_DIR/bin/$BINARY_DIR/quipa"

# バイナリの存在確認
if [ ! -f "$BINARY_PATH" ]; then
    echo -e "${RED}❌ バイナリが見つかりません: $BINARY_PATH${NC}"
    echo "先に 'npm run build' を実行してください"
    exit 1
fi

# インストール先
INSTALL_DIR="/usr/local/bin"
LINK_NAME="quipa"

# /usr/local/bin の存在確認
if [ ! -d "$INSTALL_DIR" ]; then
    echo "📁 $INSTALL_DIR を作成します..."
    sudo mkdir -p "$INSTALL_DIR"
fi

# 既存のシンボリックリンクを削除
if [ -L "$INSTALL_DIR/$LINK_NAME" ]; then
    echo "🗑️  既存のシンボリックリンクを削除します..."
    sudo rm "$INSTALL_DIR/$LINK_NAME"
fi

# シンボリックリンクを作成
echo "🔗 シンボリックリンクを作成します..."
sudo ln -s "$BINARY_PATH" "$INSTALL_DIR/$LINK_NAME"

# 実行権限を確認
chmod +x "$BINARY_PATH"

echo ""
echo -e "${GREEN}✅ インストール完了！${NC}"
echo ""
echo "使い方:"
echo "  quipa --help"
echo ""
echo "アンインストールする場合:"
echo "  ./uninstall.sh"
echo ""
