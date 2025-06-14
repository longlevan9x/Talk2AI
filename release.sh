#!/bin/bash

VERSION=$1
TAG="v$VERSION"
ZIP_NAME="extension-$TAG.zip"
DIST_DIR="dist"

# Kiểm tra version
if [ -z "$VERSION" ]; then
  echo "❌ Bạn phải truyền vào version. Ví dụ: ./release.sh 1.0.1"
  exit 1
fi

# Kiểm tra clean working tree
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working tree không sạch. Hãy commit/stash trước khi release."
  exit 1
fi

# Build
echo "🔨 Build dự án..."
npm run build

# Kiểm tra dist
if [ ! -d "$DIST_DIR" ]; then
  echo "❌ Không tìm thấy thư mục dist."
  exit 1
fi

# Tạo file zip
echo "📦 Đóng gói $ZIP_NAME"
cd "$DIST_DIR"
zip -r "../$ZIP_NAME" .
cd ..

# Tạo git tag
git tag "$TAG"
git push origin "$TAG"

# Gợi ý URL tạo GitHub Release
REPO_URL=$(git config --get remote.origin.url)
REPO_URL=${REPO_URL%.git}
REPO_URL=${REPO_URL/git@github.com:/https:\/\/github.com\/}

echo "✅ Đã tạo ZIP và tag $TAG"
echo "📤 Tạo GitHub Release tại:"
echo "🔗 $REPO_URL/releases/new?tag=$TAG"
