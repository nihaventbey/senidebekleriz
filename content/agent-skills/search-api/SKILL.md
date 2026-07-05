# Search API

Search Turkish cities and cultural places on Seni de Bekleriz.

## Endpoint

`GET /api/search?q={query}`

- Minimum query length: 2 characters
- Returns up to 5 cities and 10 places

## Example

```http
GET /api/search?q=ayasofya HTTP/1.1
Host: senidebekleriz.com
Accept: application/json
```

## Response

JSON object with a `results` array. Each item has `type` (`city` or `place`), `name`, `slug`, and optional `description`.

## Discovery

- OpenAPI: `/.well-known/openapi.json`
- API catalog: `/.well-known/api-catalog`
