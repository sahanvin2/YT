# 動画品質選択機能 - 実装ガイド

## 📋 概要

この機能により、ユーザーはYouTubeやVKのようなストリーミングサイトと同様に、動画の品質を選択できるようになります。

## 🎯 実装された機能

### 1. **複数品質の自動生成**
   - 動画アップロード時に、元の動画の解像度に基づいて複数の品質を自動生成
   - 対応品質: 144p, 240p, 360p, 480p, 720p, 1080p, 1440p (2K)

### 2. **品質選択UI**
   - 動画視聴ページで品質を選択可能
   - 各品質のファイルサイズを表示
   - 自動品質選択（推奨）オプション

### 3. **バックグラウンド処理**
   - 品質生成は非同期で実行されるため、アップロードが即座に完了
   - 品質生成中でも動画は視聴可能（元の品質で）

## 🔧 技術的な実装

### バックエンド

#### 1. **動画トランスコーダー (`backend/utils/videoTranscoder.js`)**
   - ffmpegを使用して複数の品質を生成
   - 各品質の設定:
     - **144p**: 256x144, 200kbps
     - **240p**: 426x240, 400kbps
     - **360p**: 640x360, 800kbps
     - **480p**: 854x480, 1200kbps
     - **720p**: 1280x720, 2500kbps
     - **1080p**: 1920x1080, 5000kbps
     - **1440p (2K)**: 2560x1440, 8000kbps

#### 2. **アップロード処理の変更**
   - 元の動画をB2にアップロード
   - バックグラウンドで品質バリアントを生成
   - 各品質をB2にアップロード
   - Videoモデルの`variants`フィールドに保存

### フロントエンド

#### 1. **品質選択UI**
   - 動画プレイヤーの下に品質選択ドロップダウン
   - 利用可能な品質を一覧表示
   - 現在選択中の品質を表示

## 📝 必要な設定

### 1. **環境変数**
   既存の環境変数で動作しますが、以下を確認してください：
   - `B2_BUCKET` - Backblaze B2バケット名
   - `B2_PUBLIC_BASE` - B2パブリックURL
   - `B2_ENDPOINT` - B2エンドポイント
   - `B2_ACCESS_KEY_ID` - B2アクセスキー
   - `B2_SECRET_ACCESS_KEY` - B2シークレットキー

### 2. **ディスク容量**
   - 品質生成には一時的なディスク容量が必要です
   - `tmp`ディレクトリに十分な容量があることを確認してください
   - 各品質の動画ファイルが一時的に保存されます

### 3. **処理時間**
   - 品質生成には時間がかかります（動画の長さと解像度による）
   - 短い動画（1-2分）: 約2-5分
   - 長い動画（10分以上）: 10-30分以上
   - 品質生成はバックグラウンドで実行されるため、アップロードは即座に完了します

## 🚀 使い方

### ユーザー側

1. **動画をアップロード**
   - 通常通り動画をアップロード
   - アップロード完了後、品質生成がバックグラウンドで開始

2. **品質を選択**
   - 動画視聴ページで品質選択ドロップダウンを開く
   - 希望の品質を選択（144p, 240p, 360p, 480p, 720p, 1080p, 1440p）
   - 「Auto (Recommended)」を選択すると、自動的に最適な品質が選択されます

### 開発者側

#### 品質生成の確認

品質生成の進捗はサーバーのコンソールログで確認できます：

```
Transcoding 144p: ffmpeg command...
Processing 144p: 45%
✓ Generated and uploaded 144p variant
```

#### 品質生成のステータス確認

動画の`variants`配列を確認することで、生成された品質を確認できます：

```javascript
// MongoDBで確認
db.videos.findOne({ _id: ObjectId("...") }, { variants: 1 })
```

## ⚠️ 注意事項

### 1. **ストレージ容量**
   - 複数の品質を生成すると、ストレージ使用量が大幅に増加します
   - 例: 100MBの元動画 → 約300-500MB（全品質合計）

### 2. **処理負荷**
   - 品質生成はCPU集約的な処理です
   - 複数の動画を同時にアップロードすると、サーバーの負荷が高くなります
   - 本番環境では、専用のワーカーサーバーやキューシステムの使用を推奨

### 3. **既存の動画**
   - 既にアップロードされた動画には品質バリアントがありません
   - 新しい動画のみ、品質バリアントが自動生成されます

## 🔄 既存動画に品質を追加する方法

既存の動画に品質バリアントを追加するには、以下のスクリプトを使用できます：

```javascript
// scripts/generateVariants.js
const Video = require('../backend/models/Video');
const { generateVideoVariants, getVideoResolution } = require('../backend/utils/videoTranscoder');
const { downloadFile } = require('../backend/utils/b2'); // 実装が必要

async function generateVariantsForVideo(videoId) {
  const video = await Video.findById(videoId);
  if (!video) {
    console.error('Video not found');
    return;
  }

  // 元の動画をダウンロード（実装が必要）
  const tmpPath = await downloadFile(video.videoUrl);
  
  // 解像度を取得
  const resolution = await getVideoResolution(tmpPath);
  
  // 品質バリアントを生成
  const variants = await generateVideoVariants(
    tmpPath,
    video.user.toString(),
    video._id.toString(),
    resolution.height
  );
  
  // 動画を更新
  await Video.findByIdAndUpdate(videoId, {
    variants: variants,
    sources: variants
  });
  
  console.log(`✓ Generated ${variants.length} variants for video ${videoId}`);
}
```

## 📊 品質設定のカスタマイズ

品質設定を変更するには、`backend/utils/videoTranscoder.js`の`QUALITY_PRESETS`を編集：

```javascript
const QUALITY_PRESETS = {
  '144': { width: 256, height: 144, bitrate: '200k', audioBitrate: '64k' },
  // 新しい品質を追加
  '2160': { width: 3840, height: 2160, bitrate: '15000k', audioBitrate: '256k' }
};
```

## 🐛 トラブルシューティング

### 品質が生成されない

1. **ffmpegの確認**
   ```bash
   node -e "console.log(require('ffmpeg-static'))"
   ```

2. **ログの確認**
   - サーバーのコンソールログでエラーを確認
   - `tmp`ディレクトリの権限を確認

3. **ディスク容量の確認**
   ```bash
   df -h
   ```

### 品質選択が表示されない

1. **動画データの確認**
   - 動画の`variants`配列が空でないか確認
   - ブラウザのコンソールでエラーを確認

2. **APIレスポンスの確認**
   - ネットワークタブで`/api/videos/:id`のレスポンスを確認
   - `variants`または`sources`フィールドが含まれているか確認

## 🎉 完了！

これで、YouTubeやVKのような動画品質選択機能が実装されました。ユーザーは自分の接続速度やデバイスに応じて最適な品質を選択できます。

