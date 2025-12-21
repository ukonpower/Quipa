#!/bin/bash

set -e

# 色の定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🗑️  Quipa アンインストールスクリプト"
echo ""

# インストール先
INSTALL_DIR="/usr/local/bin"
LINK_NAME="quipa"
LINK_PATH="$INSTALL_DIR/$LINK_NAME"

# シンボリックリンクの存在確認
if [ ! -L "$LINK_PATH" ]; then
    echo -e "${YELLOW}⚠️  Quipa はインストールされていません${NC}"
    exit 0
fi

# シンボリックリンクを削除
echo "🗑️  シンボリックリンクを削除します..."
sudo rm "$LINK_PATH"

echo ""
echo -e "${GREEN}✅ アンインストール完了！${NC}"
echo ""
