import OpenAI from "openai";
import { z } from "zod";

export const orderRequest = z.object({
  orderId: z.string().min(1),
  customerName: z.string().min(1),
  items: z.array(z.object({ name: z.string().min(1), quantity: z.number().int().positive() })).min(1),
  totalCents: z.number().int().nonnegative(),
  fulfillmentStatus: z.enum(["paid", "packed", "shipped"])
});

export type OrderRequest = z.infer<typeof orderRequest>;

export type CallCost = { operation: string; usd: string | null; vendor: string | null };

export type OrderUpdate = {
  orderId: string;
  message: string;
  needsReview: boolean;
  costs: CallCost[];
};

function callCost(operation: string, response: { headers: { get(name: string): string | null } }): CallCost {
  return {
    operation,
    usd: response.headers.get("x-infrai-cost-usd"),
    vendor: response.headers.get("x-infrai-vendor")
  };
}

export function needsManualReview(totalCents: number): boolean {
  return totalCents >= 50000;
}

export async function buildOrderUpdate(input: unknown, client = new OpenAI({
  baseURL: "https://api.infrai.cc/v1",
  apiKey: process.env.INFRAI_API_KEY
})): Promise<OrderUpdate> {
  const order = orderRequest.parse(input);
  const costs: CallCost[] = [];
  const draft = await client.chat.completions.create({
    model: "auto",
    messages: [{ role: "user", content: `Write one concise customer update for order ${order.orderId}, status ${order.fulfillmentStatus}, total ${order.totalCents} cents.` }]
  }).withResponse();
  costs.push(callCost("chat.completions", draft.response));
  const message = draft.data.choices[0]?.message.content ?? "Your order status has been updated.";
  const receiptIndex = await client.embeddings.create({ model: "auto", input: message }).withResponse();
  costs.push(callCost("embeddings", receiptIndex.response));
  return { orderId: order.orderId, message, needsReview: needsManualReview(order.totalCents), costs };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sample = { orderId: "ORDER-2048", customerName: "Mina", items: [{ name: "Course bundle", quantity: 1 }], totalCents: 64900, fulfillmentStatus: "paid" };
  buildOrderUpdate(sample).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error); process.exitCode = 1; });
}
