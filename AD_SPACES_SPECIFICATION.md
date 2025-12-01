# 広告スペース仕様書 (Ad Spaces Specification)

このドキュメントは、Moviaプラットフォーム内のすべての広告スペースのサイズと位置を記載しています。

## 📐 広告スペース一覧

### 1. **ホームページ (Home Page)**
- **位置**: `location="home"`
- **配置場所**: 動画グリッドの最初の動画の後
- **現在のサイズ**: 728px × 90px (Leaderboard)
- **推奨サイズ**: 
  - デスクトップ: 728px × 90px (Leaderboard) または 970px × 250px (Large Leaderboard)
  - モバイル: 320px × 50px (Mobile Banner) または 300px × 250px (Medium Rectangle)

### 2. **カテゴリーページ (Category Page)**
- **位置**: `location="category"`
- **配置場所**: ページ上部、「All Categories」タイトルの上
- **現在のサイズ**: 728px × 90px (Leaderboard)
- **推奨サイズ**: 
  - デスクトップ: 728px × 90px (Leaderboard)
  - モバイル: 320px × 50px (Mobile Banner)

### 3. **動画視聴ページ - 上部 (Watch Page - Top)**
- **位置**: `location="watch"`
- **配置場所**: 動画プレーヤーの上
- **現在のサイズ**: 728px × 90px (Leaderboard)
- **推奨サイズ**: 
  - デスクトップ: 728px × 90px (Leaderboard) または 970px × 250px (Large Leaderboard)
  - モバイル: 320px × 50px (Mobile Banner)

### 4. **動画視聴ページ - サイドバー (Watch Page - Sidebar)**
- **位置**: `location="sidebar"`
- **配置場所**: サイドバー内、関連動画の上
- **サイドバー幅**: 400px (デスクトップ), 350px (タブレット)
- **現在のサイズ**: 728px × 90px (Leaderboard) - **⚠️ サイズが大きすぎます**
- **推奨サイズ**: 
  - デスクトップ: 300px × 250px (Medium Rectangle) または 300px × 600px (Half Page)
  - タブレット: 300px × 250px (Medium Rectangle)
  - モバイル: 320px × 50px (Mobile Banner)

### 5. **ダウンロードページ - 上部 (Download Page - Top)**
- **位置**: `location="download-top"`
- **配置場所**: ページ上部
- **現在のサイズ**: 728px × 90px (Leaderboard)
- **推奨サイズ**: 
  - デスクトップ: 728px × 90px (Leaderboard)
  - モバイル: 320px × 50px (Mobile Banner)

### 6. **ダウンロードページ - 下部 (Download Page - Bottom)**
- **位置**: `location="download-bottom"`
- **配置場所**: ページ下部
- **現在のサイズ**: 728px × 90px (Leaderboard)
- **推奨サイズ**: 
  - デスクトップ: 728px × 90px (Leaderboard)
  - モバイル: 320px × 50px (Mobile Banner)

### 7. **ダウンロードモーダル - 上部 (Download Modal - Top)**
- **位置**: `location="download-modal-top"`
- **配置場所**: モーダル内の上部
- **現在のサイズ**: 728px × 90px (Leaderboard)
- **推奨サイズ**: 
  - デスクトップ: 728px × 90px (Leaderboard)
  - モバイル: 300px × 250px (Medium Rectangle)

### 8. **ダウンロードモーダル - サイドバー (Download Modal - Sidebar)**
- **位置**: `location="download-modal-sidebar"`
- **配置場所**: モーダル内のサイドバー
- **現在のサイズ**: 728px × 90px (Leaderboard) - **⚠️ サイズが大きすぎます**
- **推奨サイズ**: 
  - デスクトップ: 300px × 250px (Medium Rectangle)
  - モバイル: 300px × 250px (Medium Rectangle)

### 9. **ダウンロードモーダル - 下部 (Download Modal - Bottom)**
- **位置**: `location="download-modal-bottom"`
- **配置場所**: モーダル内の下部
- **現在のサイズ**: 728px × 90px (Leaderboard)
- **推奨サイズ**: 
  - デスクトップ: 728px × 90px (Leaderboard)
  - モバイル: 300px × 250px (Medium Rectangle)

## 📊 標準的な広告サイズ一覧

### バナー広告 (Banner Ads)
- **728px × 90px** - Leaderboard (標準的なバナー)
- **970px × 250px** - Large Leaderboard (大きなバナー)
- **468px × 60px** - Banner (小さなバナー)
- **320px × 50px** - Mobile Banner (モバイル用)

### 矩形広告 (Rectangle Ads)
- **300px × 250px** - Medium Rectangle (最も一般的なサイドバー広告)
- **336px × 280px** - Large Rectangle
- **250px × 250px** - Square

### 縦長広告 (Skyscraper Ads)
- **300px × 600px** - Half Page (サイドバー用)
- **160px × 600px** - Wide Skyscraper
- **120px × 600px** - Skyscraper

## ⚠️ 重要な注意事項

1. **サイドバー広告**: 現在、サイドバー（幅400px）に728px × 90pxの広告を配置していますが、これは**幅が大きすぎます**。300px × 250pxまたは300px × 600pxに変更することを推奨します。

2. **レスポンシブ対応**: すべての広告スペースは、デスクトップ、タブレット、モバイルで異なるサイズを表示できるように設計されています。

3. **広告の形式**: 現在、すべての広告スペースはiframe形式の広告をサポートしています。

## 🔧 広告サイズの変更方法

各広告スペースのサイズを変更するには、`client/src/components/Ad/AdBanner.js`ファイル内の以下の部分を編集してください：

```javascript
window.atOptions[adKey] = {
    'key': adKey,
    'format': 'iframe',
    'height': 90,  // 高さを変更
    'width': 728,  // 幅を変更
    'params': {}
};
```

また、CSSファイル（`client/src/components/Ad/AdBanner.css`）でコンテナのサイズも調整してください。

## 📝 各位置の推奨広告サイズまとめ

| 位置 | 現在のサイズ | 推奨サイズ（デスクトップ） | 推奨サイズ（モバイル） |
|------|------------|------------------------|---------------------|
| home | 728×90 | 728×90 または 970×250 | 320×50 または 300×250 |
| category | 728×90 | 728×90 | 320×50 |
| watch | 728×90 | 728×90 または 970×250 | 320×50 |
| sidebar | 728×90 ⚠️ | **300×250** または **300×600** | 320×50 |
| download-top | 728×90 | 728×90 | 320×50 |
| download-bottom | 728×90 | 728×90 | 320×50 |
| download-modal-top | 728×90 | 728×90 | 300×250 |
| download-modal-sidebar | 728×90 ⚠️ | **300×250** | 300×250 |
| download-modal-bottom | 728×90 | 728×90 | 300×250 |

## 🎯 次のステップ

1. サイドバー広告のサイズを300×250または300×600に変更
2. 各位置に適切なサイズの広告コードを提供
3. レスポンシブ対応の確認

