#!/bin/bash
set -e

INSTALL_DIR="$HOME/.local/bin"
BINARY_NAME="quipa"

echo "🚀 Installing Quipa..."

# プラットフォーム判定
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    PLATFORM="apple-silicon"
elif [ "$ARCH" = "x86_64" ]; then
    PLATFORM="intel"
else
    echo "❌ Unsupported architecture: $ARCH"
    exit 1
fi

echo "📦 Detected platform: macOS ($PLATFORM)"

# インストールディレクトリ作成
mkdir -p "$INSTALL_DIR"

# ダウンロード
DOWNLOAD_URL="https://github.com/ukonpower/quipa/releases/latest/download/quipa-macos-$PLATFORM.zip"
echo "⬇️  Downloading from $DOWNLOAD_URL..."

if ! curl -fL "$DOWNLOAD_URL" -o /tmp/quipa.zip; then
    echo "❌ Failed to download. Please check your internet connection and try again."
    exit 1
fi

# 解凍してインストール
echo "📂 Installing to $INSTALL_DIR..."
unzip -o /tmp/quipa.zip -d /tmp > /dev/null 2>&1
mv /tmp/quipa "$INSTALL_DIR/$BINARY_NAME"
chmod +x "$INSTALL_DIR/$BINARY_NAME"
rm /tmp/quipa.zip

echo "✅ Binary installed to $INSTALL_DIR/$BINARY_NAME"

# PATH設定チェック
if [[ ":$PATH:" == *":$INSTALL_DIR:"* ]]; then
    echo "✅ $INSTALL_DIR is already in PATH"
else
    echo "⚙️  Adding $INSTALL_DIR to PATH..."

    # zsh用（macOS Catalina以降のデフォルト）
    if [ -f "$HOME/.zshrc" ] || [ -n "$ZSH_VERSION" ]; then
        if ! grep -q 'export PATH="$HOME/.local/bin:$PATH"' "$HOME/.zshrc" 2>/dev/null; then
            echo '' >> "$HOME/.zshrc"
            echo '# Added by Quipa installer' >> "$HOME/.zshrc"
            echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"
            echo "✅ Added to ~/.zshrc"
        fi
    fi

    # bash用
    if [ -f "$HOME/.bash_profile" ] || [ -f "$HOME/.bashrc" ]; then
        TARGET_FILE="$HOME/.bash_profile"
        [ ! -f "$TARGET_FILE" ] && TARGET_FILE="$HOME/.bashrc"

        if ! grep -q 'export PATH="$HOME/.local/bin:$PATH"' "$TARGET_FILE" 2>/dev/null; then
            echo '' >> "$TARGET_FILE"
            echo '# Added by Quipa installer' >> "$TARGET_FILE"
            echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$TARGET_FILE"
            echo "✅ Added to $TARGET_FILE"
        fi
    fi

    echo ""
    echo "⚠️  Please run one of the following to update your current shell:"
    echo "   source ~/.zshrc    # for zsh"
    echo "   source ~/.bash_profile    # for bash"
    echo ""
    echo "Or simply restart your terminal."
fi

echo ""
echo "🎉 Quipa installed successfully!"
echo ""
echo "Try running: quipa --help"
