```
npm install
npm run dev
```

```
open http://localhost:3000
```

Please read @README.MD and @SYSTEM_DESIGN.MD to understand this project first. Now, we're going to build a proxy api based on the hono framework.

The first function to implement is the proxy api. it will release api url receive the request with the model, and route the request based on the model prefix.
for example, body with the model name "minimax/MiniMax-M3", the minimax is the provider, the request will route to `https://api.minimaxi.com/v1`

Now these are the providers available:
providers, url, example model, API_KEY environment variable

- minmax: ttps://api.minimaxi.com/v1, MiniMax-M3, MINIMAX_API_KEY
- openai: https://api.openai.com/v1, gpt-4-mini, OPENAI_API_KEY
- deepseek: https://api.deepseek.com, deepseek-v4-pro, DEEPSEEK_API_KEY

Please implement the proxy api on the file @apps/proxy/src/index.ts
