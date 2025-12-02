# Bunny CDN セットアップガイド

## 問題: 動画がB2から直接配信されている

動画がBunny CDN経由ではなく、Backblaze B2から直接配信されている場合の解決方法です。

## 1. 環境変数の確認

バックエンドの`.env`ファイルに以下が設定されているか確認してください：

```env
CDN_BASE=https://movia-1.b-cdn.net
```

または、カスタムドメインを使用する場合：

```env
CDN_BASE=https://cdn.movia.club
```

## 2. EC2での設定手順

### ステップ1: .envファイルを編集

```bash
cd /path/to/your/backend
nano .env
```

### ステップ2: CDN_BASEを追加

`.env`ファイルの最後に以下を追加：

```env
CDN_BASE=https://movia-1.b-cdn.net
```

**重要**: 
- `CDN_BASE`と`=`の間にスペースを入れない
- 値の前後に引用符（`"`や`'`）を付けない
- `https://`を含める

### ステップ3: サーバーを再起動

```bash
pm2 restart movia-backend
# または
pm2 restart all
```

### ステップ4: ログを確認

```bash
pm2 logs movia-backend --lines 50
```

以下のようなメッセージが表示されるはずです：

```
🌐 Bunny CDN configured: https://movia-1.b-cdn.net
```

もし以下の警告が表示される場合、環境変数が設定されていません：

```
⚠️  CDN_BASE not set in environment variables!
```

## 3. 動作確認方法

### ブラウザの開発者ツールで確認

1. **F12**キーを押して開発者ツールを開く
2. **Console**タブを開く
3. 動画ページを読み込む
4. 以下のログを確認：

**正常な場合:**
```
✅ Using Bunny CDN: https://movia-1.b-cdn.net/videos/...
✅ ReactPlayer using CDN URL: https://movia-1.b-cdn.net/videos/...
```

**問題がある場合:**
```
⚠️ Still using B2 directly: https://f005.backblazeb2.com/file/movia-prod/...
⚠️ ReactPlayer using B2 URL (not CDN): https://f005.backblazeb2.com/file/movia-prod/...
```

### Networkタブで確認

1. **Network**タブを開く
2. 動画ファイルを探す
3. URLが`movia-1.b-cdn.net`または`cdn.movia.club`になっているか確認
4. `f005.backblazeb2.com`が表示されていないか確認

## 4. トラブルシューティング

### 問題1: 環境変数が設定されても動作しない

**解決策:**
1. サーバーを完全に再起動：
```bash
pm2 stop movia-backend
pm2 delete movia-backend
pm2 start backend/server.js --name movia-backend
pm2 save
```

2. `.env`ファイルの場所を確認：
   - `.env`ファイルは`backend`ディレクトリに配置されている必要があります
   - パス: `/path/to/your/project/backend/.env`

### 問題2: バックエンドのログに警告が表示される

**確認事項:**
- `.env`ファイルに`CDN_BASE`が正しく設定されているか
- サーバーが再起動されているか
- `.env`ファイルの構文エラーがないか（スペース、引用符など）

### 問題3: 一部の動画だけB2から配信される

**原因:**
- 古い動画データがキャッシュされている可能性

**解決策:**
- ブラウザのキャッシュをクリア
- ハードリロード（Ctrl+Shift+R または Cmd+Shift+R）

### 問題4: Bunny CDNのログにoutgoing dataが表示されない

**原因:**
- 初回リクエスト時はBunny CDNがB2から取得するため、時間がかかります
- キャッシュが生成されるまで待つ必要があります

**解決策:**
- 動画を数回再生してみる
- Bunny CDNのキャッシュ設定を確認

## 5. 環境変数の確認コマンド

サーバー上で環境変数が正しく読み込まれているか確認：

```bash
# Node.jsで確認
node -e "require('dotenv').config(); console.log('CDN_BASE:', process.env.CDN_BASE);"
```

または、バックエンドのコードに一時的に追加：

```javascript
console.log('CDN_BASE:', process.env.CDN_BASE);
```

## 6. 完全な.envファイルの例

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/movia?retryWrites=true&w=majority
JWT_SECRET=your_secret_here
JWT_EXPIRE=30d
CLIENT_URL=https://yourdomain.com

# B2 Storage
B2_BUCKET=movia-prod
B2_PUBLIC_BASE=https://f005.backblazeb2.com/file/movia-prod
B2_ENDPOINT=https://s3.us-west-000.backblazeb2.com
B2_ACCESS_KEY_ID=your-key-id
B2_SECRET_ACCESS_KEY=your-secret-key

# Bunny CDN (重要!)
CDN_BASE=https://movia-1.b-cdn.net
```

## 7. 確認チェックリスト

- [ ] `.env`ファイルに`CDN_BASE=https://movia-1.b-cdn.net`が追加されている
- [ ] サーバーが再起動されている
- [ ] バックエンドのログに`🌐 Bunny CDN configured`が表示される
- [ ] ブラウザのコンソールに`✅ Using Bunny CDN`が表示される
- [ ] NetworkタブでCDN URLが使用されている

## 8. サポート

問題が解決しない場合、以下を確認してください：

1. Bunny CDNのPull Zone設定
   - Origin: `https://f005.backblazeb2.com/file/movia-prod`
   - Hostname: `movia-1.b-cdn.net`

2. バックエンドのログ
   - `pm2 logs movia-backend`でエラーを確認

3. ブラウザのコンソール
   - エラーメッセージを確認

