# Firebase ステージングデプロイ運用メモ

このドキュメントは、`.github/workflows/deploy-staging.yml` のセットアップ手順と運用ルールをまとめたものです。
Pull Request の更新に合わせて Firebase Hosting のプレビュー URL を自動生成・更新し、レビュアーが常に最新の検証環境を確認できるようにします。

## ワークフローの概要

- ワークフローファイル: `.github/workflows/deploy-staging.yml`
- トリガー: PR の作成・更新・ラベル付与時 (`opened`, `synchronize`, `reopened`, `labeled`, `unlabeled`)
- 主な処理:
  1. PR のヘッドコミットをチェックアウト
  2. `yarn install` → `yarn build`
  3. `FirebaseExtended/action-hosting-deploy` で PR 番号を元にしたプレビュー チャンネルへデプロイ（有効期限 7 日）
  4. プレビュー URL を PR に自動投稿（公式 Action がコメントします）
- `no-preview` ラベルが付いている PR はスキップします。
- 同じ PR 内での再実行は古いジョブをキャンセルし、常に最新コミットのみを配信します。

## セットアップ手順

1. **サービスアカウントの準備**
   - Firebase Hosting へデプロイできるロール（`Firebase Hosting Admin` など）を付与したサービスアカウントを作成。
   - JSON キーを GitHub Secrets に `FIREBASE_SERVICE_ACCOUNT` という名前で保存。

2. **プロジェクト ID の設定**
   - デプロイ先 Firebase プロジェクトの ID を `FIREBASE_PROJECT_ID` シークレットとして登録。

3. **Hosting ターゲットの確認**
   - ワークフローは `hosting:staging` ターゲットを前提としています。
   - `firebase.json` / `.firebaserc` 側で `staging` ターゲットが定義されていない場合は、ターゲットを追加するか、`FIREBASE_HOSTING_TARGET` 環境変数を変更してください。

4. **PR ラベル運用**
   - プレビューを生成したくない PR（例: ドキュメントのみ）は `no-preview` ラベルを付けてスキップできます。

## 運用フロー

1. 開発者が PR を作成または更新すると、自動でプレビュー チャンネル `pr-<PR番号>` にデプロイされます。
2. デプロイ完了後、公式 Action が PR にプレビュー URL をコメントします。同じ PR の再実行時は同一 URL が上書き更新されます。
3. プレビュー チャンネルは 7 日後に自動失効します。チャンネル数の上限を超えそうな場合は `expires` の短縮や `no-preview` ラベル運用で調整してください。

## 残タスク / フォローアップ

- [ ] Firebase 側で `staging` ターゲットを定義し、必要であれば CDN 設定やリライト設定を確認する。
- [ ] サービスアカウントの権限をチームでレビューし、最小権限化を図る。
- [ ] プレビュー URL を Slack 等へも通知したい場合は、別途通知ワークフローを用意する。
- [ ] PR クローズ時に即時削除したい場合は、`firebase hosting:channel:delete` を呼ぶクリーンアップ ワークフローを追加する。

この運用で、PR ごとに自動生成されるプレビュー環境を使い、レビューサイクルを高速化できます。
