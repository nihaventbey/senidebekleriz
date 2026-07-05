import { describe, it, expect } from "vitest";
import {
  cleanGoogleNewsTitle,
  isGoogleNewsArticleUrl,
  parseBatchExecuteResponse,
} from "@/lib/discovery/resolve-google-news-url";

describe("isGoogleNewsArticleUrl", () => {
  it("detects Google News article URLs", () => {
    expect(
      isGoogleNewsArticleUrl(
        "https://news.google.com/rss/articles/CBMixwFBVV95cUxOd1BQam85bUNIWFl0eDZBSXl1eUdQVlhicWhUVnF0TGw1X19xeXBJZWhGREwyRTJEYV91ZURtc1VXNV9INFhwemtTTlo0TDZnMjB1a1dzLXBIZWJWMk03c3FjY0tMWm9nR2E2YzFBbU1WMzdxa0xDOGFCQTE2Z1ppLTNwQXZMTVEwQURLN3ZQNTY3c1JMUXBiczc2alIxYjBtS1ZxZGFoUkNLUkVNc1loN1JGZ0txMGNRTHVaeUZZdDBpcWRrRTlB?oc=5"
      )
    ).toBe(true);
  });

  it("ignores normal publisher URLs", () => {
    expect(
      isGoogleNewsArticleUrl(
        "https://www.dunya.com/foto-galeri/kultur-sanat/50-eser-ilk-kez-sergileniyor-turkiyeden-19-muze-tek-sergide-bulustu-galeri-823048"
      )
    ).toBe(false);
  });
});

describe("parseBatchExecuteResponse", () => {
  it("extracts publisher URL from batchexecute payload", () => {
    const body = `)]}'

[["wrb.fr","Fbv4je","[\\"garturlres\\",\\"https://www.dunya.com/foto-galeri/kultur-sanat/50-eser-ilk-kez-sergileniyor-turkiyeden-19-muze-tek-sergide-bulustu-galeri-823048\\",1]",null,null,null,"generic"],["di",24],["af.httprm",23,"-8805565895042623545",30]]`;

    expect(parseBatchExecuteResponse(body)).toBe(
      "https://www.dunya.com/foto-galeri/kultur-sanat/50-eser-ilk-kez-sergileniyor-turkiyeden-19-muze-tek-sergide-bulustu-galeri-823048"
    );
  });
});

describe("cleanGoogleNewsTitle", () => {
  it("removes publisher suffix from RSS title", () => {
    expect(
      cleanGoogleNewsTitle(
        "50 eser ilk kez sergileniyor - Dünya",
        "Dünya"
      )
    ).toBe("50 eser ilk kez sergileniyor");
  });
});
