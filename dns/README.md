# DNS for AI Discovery (DNS-AID)

`isitagentready.com` の `checks.discoverability.dnsAid` を通すための DNS レコード例です。
レコード本体は [`dns-aid.zone`](./dns-aid.zone) にあります。

## 現状: 独自ドメインがないため合格不可

現在のサイトは `https://canooopus-me.vercel.app` のみで運用されています。
`vercel.app` は Vercel が管理するドメインであり、利用者は `_agents` サブドメインの
SVCB / HTTPS レコードを追加できません。**このチェックは独自ドメインを取得して
Vercel に接続するまで pass しません。** アプリ側のコード変更では解決できません。

### 必要な作業（独自ドメインを取得する場合）

1. **ドメイン取得**: Cloudflare Registrar、Namecheap、お名前.com などで取得
   （例: `canooopus.com`）
2. **DNS を Cloudflare に移管**: 取得元でネームサーバーを Cloudflare に向ける
   （Cloudflare Registrar なら自動。無料プランで可）
3. **Vercel に接続**: Vercel の Project → Settings → Domains に独自ドメインを追加し、
   Cloudflare 側に表示される A / CNAME を登録
4. **環境変数を更新**: `NEXT_PUBLIC_SITE_URL=https://<独自ドメイン>` にして再デプロイ
5. **DNS-AID レコードを追加**: 下記のレコードを Cloudflare に登録
6. **DNSSEC を有効化**: Cloudflare DNS → Settings → DNSSEC → Enable し、
   表示される `DS` レコードをレジストラに登録
7. **検証**: 本 README 末尾の DoH / スキャンで `status: "pass"` を確認

独自ドメインを取得しない場合は、この項目だけが fail のまま残ります
（他の discovery チェックには影響しません）。

## 追加するレコード

| Name | Type | Value |
| --- | --- | --- |
| `_index._agents` | SVCB / HTTPS | `1 example.com. alpn="h2,h3" port=443 mandatory=alpn,port` |
| `_a2a._agents` | SVCB / HTTPS | `1 example.com. alpn="a2a" port=443 mandatory=alpn,port` |
| `_mcp._agents` | SVCB / HTTPS | `1 example.com. alpn="mcp" port=443 mandatory=alpn,port` |
| `_catalog._agents` | TXT | `"url=https://example.com/.well-known/ai-catalog.json"` |
| `_search._agents` | SRV | `0 0 443 example.com.` |

Cloudflare のダッシュボードで HTTPS レコードを作成できます。
SVCB と TXT / SRV は「Import DNS records」で `dns-aid.zone` を取り込むか、
Cloudflare API の `POST /zones/{zone_id}/dns_records` で作成してください。

```json
{
  "type": "HTTPS",
  "name": "_a2a._agents",
  "ttl": 3600,
  "priority": 1,
  "data": {
    "target": "example.com",
    "value": "alpn=\"a2a\" port=443 mandatory=alpn,port"
  }
}
```

## DNSSEC

スキャナは validating resolver（Cloudflare DoH, `do=1`）で認証データ
（`AD: true`）が返ることも確認します。DNSSEC はゾーンではなく
レジストラ / DNS プロバイダ側で有効化します。

- **Cloudflare**: DNS → Settings → DNSSEC → Enable。表示される `DS` レコードを
  ドメインのレジストラに登録する
- 反映後、`dig +dnssec` または DoH の `AD` フラグで確認する

## 確認

```sh
# Cloudflare DoH（AD が true なら DNSSEC 検証済み）
curl -s -H 'Accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=_a2a._agents.example.com&type=SVCB&do=1'
```

```sh
curl -s -X POST https://isitagentready.com/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com"}' \
  | jq '.checks.discoverability.dnsAid'
```

`status` が `"pass"`、`details.dnssecValidated` が `true` になれば完了です。
