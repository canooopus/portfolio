# DNS for AI Discovery (DNS-AID)

`isitagentready.com` の `checks.discoverability.dnsAid` を通すための DNS レコード例です。
レコード本体は [`dns-aid.zone`](./dns-aid.zone) にあります。

## 前提: `*.vercel.app` では設定できない

このサイトの既定 URL は `https://canooopus-me.vercel.app` です。
`vercel.app` は Vercel が管理するドメインなので、`_agents` サブドメインの
SVCB / HTTPS レコードを追加できません。DNS-AID を公開するには、
**独自ドメインを Vercel に接続し、そのドメインの DNS を管理している
プロバイダ（Cloudflare など）でレコードを追加**してください。

1. Vercel の Project → Settings → Domains に独自ドメインを追加
2. `NEXT_PUBLIC_SITE_URL` を `https://<独自ドメイン>` に変更して再デプロイ
3. 次のレコードを追加（`example.com` を独自ドメインに置換）

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
