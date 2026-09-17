import assert from "node:assert/strict";
import { needsManualReview, orderRequest } from "./order_cost_service.js";

const valid = { orderId: "A-1", customerName: "Learner", items: [{ name: "Video course", quantity: 1 }], totalCents: 50000, fulfillmentStatus: "paid" };
assert.equal(orderRequest.parse(valid).orderId, "A-1");
assert.equal(needsManualReview(49999), false);
assert.equal(needsManualReview(50000), true);
console.log("order review decision passes");
