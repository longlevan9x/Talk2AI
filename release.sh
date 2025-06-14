#!/bin/bash

VERSION=$1
TAG="v$VERSION"
BRANCH_NAME="release/$TAG"
DIST_DIR="dist"
TEMP_DIR="temp-release"

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

# Tạo git tag
git tag "$TAG"
git push origin "$TAG"

# Đẩy nội dung dist lên nhánh release/vX.X.X
echo "🚀 Đẩy nội dung $DIST_DIR lên nhánh $BRANCH_NAME"

rm -rf "$TEMP_DIR"
mkdir "$TEMP_DIR"
cp -r "$DIST_DIR"/* "$TEMP_DIR"/
echo "$TAG" > "$TEMP_DIR/version.txt"

cd "$TEMP_DIR"
git init
git checkout -b "$BRANCH_NAME"
git remote add origin "$(git config --get remote.origin.url)"
git add .
git commit -m "Release $TAG"
git push -f origin "$BRANCH_NAME"
cd ..
rm -rf "$TEMP_DIR"

# In URL tạo GitHub Release
REPO_URL=$(git config --get remote.origin.url)
REPO_URL=${REPO_URL%.git}
REPO_URL=${REPO_URL/git@github.com:/https:\/\/github.com\/}

echo "✅ Đã tạo tag $TAG và nhánh $BRANCH_NAME"
echo "📤 Tạo GitHub Release tại:"
echo "🔗 $REPO_URL/releases/new?tag=$TAG"
