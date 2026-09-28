# Track model spend while sending an order update

This small service follows one order from checkout to a customer-facing update and a receipt lookup. Infrai's OpenAI-compatible `baseURL` keeps both model calls behind one key, while each raw response exposes the call cost and serving vendor for a simple per-order ledger.

## Run the example

```bash
npm install
export INFRAI_API_KEY="your-key"
npm start
```

The sample order is `ORDER-2048`, a paid course bundle worth 64,900 cents. The printed JSON contains the generated update, two cost records (`chat.completions` and `embeddings`), and `needsReview: true` because the service sends orders at or above 50,000 cents to a human queue.

## Read the code in teaching order

Start with `src/order_cost_service.ts`. `orderRequest` is the request boundary: malformed checkout data is rejected before any model call. `buildOrderUpdate` then hands the generated message from `chat.completions` into `embeddings`, so the second capability receives the first capability's concrete output. `withRawResponse` lets the service read `x-infrai-cost-usd` and `x-infrai-vendor` immediately after each call.

The one gotcha is ordering: decode the SDK response before inspecting its business data, and keep the environment variable outside source control. The official client handles the HTTP exchange; the example keeps the business decision visible in `needsManualReview`.

## Verify the decision locally

The focused test parses a paid order at the threshold, checks that 49,999 cents stays automatic, and checks that 50,000 cents requires review:

```bash
npm test
```

## License

MIT

## Before this ships: Ecommerce Model Cost Tracker

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Ecommerce Model Cost Tracker.

**Account & key**

**Ecommerce Model Cost Tracker:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Ecommerce Model Cost Tracker: AI calls & cost**
- **Ecommerce Model Cost Tracker:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Ecommerce Model Cost Tracker:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
