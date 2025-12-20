# LINE Developers セットアップガイド

**目的**: Business Notebook に LINE Messaging API を連携するための事前準備

---

## ステップ 1: LINE Developers アカウント作成

1. **LINE Developers にアクセス**
   - URL: https://developers.line.biz/ja/

2. **LINEアカウントでログイン**
   - 既存のLINEアカウント（個人用でOK）でログイン
   - ビジネスアカウントは不要

3. **開発者登録**
   - 初回は氏名・メールアドレスを入力して開発者登録

---

## ステップ 2: プロバイダー作成

1. **コンソールで「プロバイダーを作成」**
   - 名前の例: `Business Notebook` または `あなたの店舗名`
   - プロバイダー = チャンネルをまとめる組織単位

---

## ステップ 3: Messaging API チャンネル作成

1. **プロバイダー詳細画面で「新規チャンネル」→「Messaging API」を選択**

2. **必須項目を入力**

   | 項目 | 入力例 |
   |:---|:---|
   | チャンネルの種類 | Messaging API |
   | チャンネル名 | 〇〇院 予約通知 |
   | チャンネル説明 | 予約のリマインドや連絡に使用します |
   | 大業種 | ヘルスケア・医療 |
   | 小業種 | 整体・マッサージ（該当するもの） |
   | メールアドレス | あなたのメールアドレス |

3. **利用規約に同意して作成**

---

## ステップ 4: チャンネル設定の確認

作成後、以下の情報をメモしてください（後でVercelに設定します）：

### チャンネル基本設定タブ

| 項目 | 場所 | 用途 |
|:---|:---|:---|
| **Channel Secret** | 基本設定 → チャンネルシークレット | Webhook署名検証用 |

### Messaging API設定タブ

| 項目 | 場所 | 用途 |
|:---|:---|:---|
| **Channel Access Token** | Messaging API設定 → チャンネルアクセストークン（長期） | メッセージ送信用 |

> [!TIP]
> チャンネルアクセストークンは「発行」ボタンを押すと生成されます。

---

## ステップ 5: Webhook URL の設定（後で実施）

> この設定は、サーバー側の実装が完了してから行います。

1. **Messaging API設定タブ**を開く
2. **Webhook URL** に以下を入力（後でお知らせします）:
   ```
   https://your-vercel-domain.vercel.app/api/line/webhook
   ```
3. **Webhookの利用** を「オン」に設定
4. **応答メッセージ** を「オフ」に設定（自動応答を無効化）
5. **あいさつメッセージ** を「オフ」に設定

---

## ステップ 6: LIFF アプリ作成（ID連携用）

> この設定も、実装フェーズで詳細を案内します。

1. **チャンネル詳細画面で「LIFF」タブを開く**
2. **「追加」をクリック**
3. 以下を入力:

   | 項目 | 入力値 |
   |:---|:---|
   | LIFFアプリ名 | Business Notebook 連携 |
   | サイズ | Tall |
   | エンドポイントURL | `https://your-vercel-domain.vercel.app/line/link` |
   | Scope | `profile` をチェック |

4. 作成後、**LIFF ID** をメモ

---

## チェックリスト（完了後に報告してください）

- [ ] LINE Developers アカウント作成完了
- [ ] プロバイダー作成完了
- [ ] Messaging API チャンネル作成完了
- [ ] Channel Secret を取得
- [ ] Channel Access Token を発行・取得

以下の情報を（安全な方法で）共有いただければ、Vercel環境変数の設定に進めます：
- Channel Secret
- Channel Access Token

> [!CAUTION]
> これらのトークンは絶対に公開リポジトリにコミットしないでください。
> Vercel Dashboard の環境変数として設定します。

---

## 参考リンク

- [LINE Developers 公式ドキュメント](https://developers.line.biz/ja/docs/)
- [Messaging API 概要](https://developers.line.biz/ja/docs/messaging-api/overview/)
- [無料プランの制限](https://developers.line.biz/ja/docs/messaging-api/overview/#line-official-account-plan)

---

## 無料プランの制限と対策

| 項目 | 制限 | 対策 |
|:---|:---|:---|
| **Push メッセージ** | 月500通まで | リマインドは翌日予約のみに限定 |
| **Reply メッセージ** | 無制限 | 顧客からのメッセージへの返信は無料 |

### 500通制限で運用するための指針

- **予約リマインド**: 前日のみ送信（当日は不要）
- **手動送信**: 必要最小限に
- **確認メッセージ**: 予約確定時ではなく、ID連携完了時のみ送信

---

*セットアップ完了後、お知らせいただければ実装フェーズに移ります。*
