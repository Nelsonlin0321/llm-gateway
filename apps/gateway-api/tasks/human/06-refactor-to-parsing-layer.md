```shell
createOpenaiProxyHandler and createAnthropicProxyHandler are preparing the payload, and resolve provider, proxy to the master url with master api key.
```

The goal is to refactor the codes to decouple, the preparing payload,buildUpstreamUrl, and the parsing layer from the ProxyHandler.

My design is to create a new layer called parsing layer, which is responsible for the preparing payload,buildUpstreamUrl, and the parsing layer, and then call the proxy handler.
the parsing layer will ingest necessary information in the request context to the proxy handler.
The necessary information includes but may not limited to
1 - child key JWT Payload
2 - upstream model name,master api key , and upstream url

update defaultProviderModelLookup to include creator_id as a parameter because the creator_id is used to lookup the model that belong to the creator.
