# Explore Places

List museums, historic sites, art venues, and parks across Turkey.

## Endpoint

`GET /api/places`

### Query parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `city` | string | Filter by city slug (e.g. `istanbul`) |
| `category` | string | Filter by category slug (`muzeler`, `tarihi-yer`, `sanat-mekanlari`, `parklar`) |
| `page` | integer | Page number (default 1) |
| `limit` | integer | Page size 1–50 (default 20) |

## Example

```http
GET /api/places?city=istanbul&category=muzeler&limit=10 HTTP/1.1
Host: senidebekleriz.com
Accept: application/json
```

## Discovery

- Human docs: `/docs/api#places`
- Auth (public, no credentials): `/auth.md`
