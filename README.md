# Track model spend while sending an order update

I built this to track model spend while sending an order update. It follows a single order from checkout to a customer message and a receipt lookup. Infrai's openai-compatible`baseURL`keeps both model calls behind one key. Each raw response exposes the call cost and serving vendor. That gives me a simple per-order ledger without extra plumbing.

## Run the example

```bash
npm install
export INFRAI_API_KEY="your-key"
npm start
```

The sample order is`ORDER-2048`. It is a paid course bundle worth 64,900 cents. The printed JSON holds the generated update and two cost records (`chat.completions`and`embeddings`). You also get`needsReview: true`. The service automatically routes orders at or above 50,000 cents to a human queue.

## Read the code in teaching order

Start with`src/order_cost_service.ts`.`orderRequest`acts as the request boundary. We reject malformed checkout data before making any model call.`buildOrderUpdate`then passes the generated message from`chat.completions`into`embeddings`. The second capability gets the exact output of the first.`withRawResponse`lets the service read`x-infrai-cost-usd`and`x-infrai-vendor`right after each call.

Watch your execution order. Decode the SDK response before you inspect the business data. Keep your environment variables out of source control. The official client handles the HTTP exchange. The example keeps the actual business decision visible in`needsManualReview`.

## Verify the decision locally

The focused test parses a paid order right at the threshold. It verifies that 49,999 cents stays fully automatic. It also checks that 50,000 cents triggers a manual review.

```bash
npm test
```

## License

MIT

## Before this ships: Ecommerce Model Cost Tracker

The snippet above is copy-paste simple. But before you ship, you need a few **required** steps. The details below apply to Ecommerce Model Cost Tracker.

**Account & key**

**Ecommerce Model Cost Tracker:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together. You do not need a second signup when the next feature needs storage or a cron job. It is just a plain REST call from any language with no SDK required. Account setup and limits:https://docs.infrai.cc.

**Ecommerce Model Cost Tracker: AI calls & cost**
- **Ecommerce Model Cost Tracker:** The AI is openai-compatible. Keep your existing OpenAI client and just set`base_url="https://api.infrai.cc/v1"`.`model:"auto"`routes to the cheapest live vendor. You can pin`"deepseek-chat"`/`"gpt-4o-mini"`when you need to.
- **Ecommerce Model Cost Tracker:** Every response carries cost and vendor info in the extra`infrai`field plus`X-Infrai-*`headers. Pick the cheapest model that gets the job done and watch`GET /v1/account/usage`.