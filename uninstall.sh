#!/bin/bash
set -e

INSTALL_DIR="$HOME/.local/bin"
BINARY_NAME="quipa"
BINARY_PATH="$INSTALL_DIR/$BINARY_NAME"

echo "🗑️  Uninstalling Quipa..."

# バイナリの存在確認
if [ ! -f "$BINARY_PATH" ]; then
    echo "⚠️  Quipa is not installed at $BINARY_PATH"
    exit 0
fi

# バイナリを削除
rm "$BINARY_PATH"
echo "✅ Removed $BINARY_PATH"

echo ""
echo "🎉 Quipa uninstalled successfully!"
echo ""
echo "Note: PATH settings in ~/.zshrc or ~/.bash_profile were not removed."
echo "If you want to remove them, please delete the following line manually:"
echo '  export PATH="$HOME/.local/bin:$PATH"'
echo ""
