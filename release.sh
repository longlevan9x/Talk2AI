#!/bin/bash

# --- Nhập version ---
VERSION=$1
RELEASE_BRANCH="release/v$VERSION"
TAG="v$VERSION"
ZIP_NAME="Talk2AI-v$VERSION.zip"
DIST_DIR="dist"

# --- Kiểm tra version ---
if [ -z "$VERSION" ]; then
  echo "❌ Bạn phải truyền vào version. Ví dụ: ./release.sh 1.0.1"
  exit 1
fi

# --- Kiểm tra clean working tree ---
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working directory không clean. Hãy commit hoặc stash thay đổi trước khi release."
  exit 1
fi

# --- Tạo và chuyển sang nhánh release ---
echo "🌿 Tạo nhánh $RELEASE_BRANCH"
git checkout -b "$RELEASE_BRANCH" || git checkout "$RELEASE_BRANCH"

# --- Build ---
echo "🔨 Build dự án..."
npm run build

# --- Kiểm tra dist ---
if [ ! -d "$DIST_DIR" ]; then
  echo "❌ Không tìm thấy thư mục dist sau khi build."
  exit 1
fi

# --- Tạo file zip ---
echo "📦 Đóng gói thư mục dist thành $ZIP_NAME"
cd "$DIST_DIR"
zip -r "../$ZIP_NAME" .
cd ..

# --- Commit & Tag ---
git add .
git commit -m "🔖 Release $TAG"
git tag "$TAG"

# --- Push branch & tag ---
echo "🚀 Đẩy branch $RELEASE_BRANCH và tag $TAG"
git push origin "$RELEASE_BRANCH"
git push origin "$TAG"

# --- Lấy GitHub URL ---
REPO_URL=$(git config --get remote.origin.url)
REPO_URL=${REPO_URL%.git}  # Remove .git nếu có
REPO_URL=${REPO_URL/git@github.com:/https:\/\/github.com\/} # SSH → HTTPS

# --- Hoàn tất ---
echo "✅ Đã tạo branch, tag, và file zip: $ZIP_NAME"
echo "📤 Tạo release trên GitHub tại:"
echo "🔗 $REPO_URL/releases/new?tag=$TAG"
