#!/bin/bash

VERSION=$1
TAG="v$VERSION"
BRANCH_NAME="release/$TAG"
DIST_DIR="dist"
TEMP_DIR="temp_release"

if [ -z "$VERSION" ]; then
  echo "❌ Bạn phải truyền vào version. Ví dụ: ./release.sh 1.0.1"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working tree không sạch. Hãy commit/stash trước khi release."
  exit 1
fi

REPO_URL=$(git config --get remote.origin.url)
if [ -z "$REPO_URL" ]; then
  echo "❌ Không tìm thấy remote origin URL trong repo hiện tại."
  exit 1
fi

REPO_URL=${REPO_URL%.git}
REPO_URL=${REPO_URL/git@github.com:/https:\/\/github.com\/}

TAG_EXISTS=$(git ls-remote --tags origin | grep "refs/tags/$TAG" || true)
if [ -n "$TAG_EXISTS" ]; then
  echo "⚠️ Tag $TAG đã tồn tại trên remote. Hủy release để tránh ghi đè."
  exit 1
fi

echo "🔨 Build dự án..."
npm run build || { echo "❌ Build thất bại"; exit 1; }

if [ ! -d "$DIST_DIR" ] || [ -z "$(ls -A $DIST_DIR)" ]; then
  echo "❌ Thư mục $DIST_DIR không tồn tại hoặc rỗng sau khi build."
  exit 1
fi

echo "🚀 Chuẩn bị tạo branch và tag release..."

rm -rf "$TEMP_DIR"
mkdir "$TEMP_DIR"
cp -r "$DIST_DIR"/* "$TEMP_DIR"/
echo "$TAG" > "$TEMP_DIR/version.txt"

cd "$TEMP_DIR"
git init
git checkout -b "$BRANCH_NAME"
git remote add origin "$REPO_URL"

git add .
git commit -m "Release $TAG"

git tag "$TAG"

echo "📤 Đẩy branch $BRANCH_NAME và tag $TAG lên remote..."
git push -f origin "$BRANCH_NAME"
git push origin "$TAG"

echo "🧹 Xóa branch release trên remote, chỉ giữ tag..."
git push origin --delete "$BRANCH_NAME"

cd ..
rm -rf "$TEMP_DIR"

echo "✅ Đã tạo và đẩy nhánh $BRANCH_NAME, tag $TAG"
echo "📤 Tạo GitHub Release tại:"
echo "🔗 $REPO_URL/releases/new?tag=$TAG"
