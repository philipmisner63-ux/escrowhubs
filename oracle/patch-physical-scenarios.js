/**
 * Step 2: Add 15 physical goods scenarios to arbiter-test-v3.mjs
 * Step 3: Add 3 physical goods cases to Golden 21
 * Step 4: Add physical goods template pool to fuzz/templates.json
 */

import fs from "fs";

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Physical goods scenarios in the v3 harness
// ─────────────────────────────────────────────────────────────────────────────

const V3 = "/root/blockdag-escrow/oracle/arbiter-test-v3.mjs";
let v3 = fs.readFileSync(V3, "utf8");

const PHYSICAL_SCENARIOS = `

// ══════════════════════════════════════════════════════════════════════
// CATEGORY 11 — Physical Goods — expected outcomes per scenario
// ══════════════════════════════════════════════════════════════════════

  // PG-1: Seller shipped with tracking, delivered, buyer disputes anyway
  {
    _m:{id:101,cat:"C11-Physical",label:"Physical — Shipped with tracking, buyer disputes after delivery",exp:"beneficiary",auto:true},
    ctx:ctx({amount:"0.5",timeElapsedSinceDeposit:"10 days",createdAt:new Date(Date.now()-10*86400000).toISOString()}),
    ev:[
      ev(B,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Shipped March 3rd via FedEx. Tracking 7489234567890. Carrier confirmed delivered March 6th, signed by J. Smith at buyer address.",trackingNumber:"7489234567890",deliveryClaim:"complete",returnPolicyOffered:"yes"}),400),
      ev(D,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Paid March 1st. Item arrived but I don't want it anymore.",deliveryClaim:"complete",requestedOutcome:"refund",requestedOutcomeReason:"Changed my mind."}),200),
    ],
  },

  // PG-2: Seller never shipped, no tracking, buyer disputes
  {
    _m:{id:102,cat:"C11-Physical",label:"Physical — Never shipped, no tracking, 30 days silence",exp:"depositor",auto:true},
    ctx:ctx({amount:"1.0",timeElapsedSinceDeposit:"30 days",createdAt:new Date(Date.now()-30*86400000).toISOString()}),
    ev:[
      ev(D,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Paid March 1st. Sent shipping address March 2nd. Nothing has arrived after 30 days. Seller has not replied to 8 messages.",deliveryClaim:"none",firstComplaintTime:"March 15th",requestedOutcome:"refund",requestedOutcomeReason:"Item never arrived and seller is not responding."}),2160),
      ev(B,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"I shipped it but lost the tracking number.",deliveryClaim:"complete",returnPolicyOffered:"no",trackingNumber:""}),60),
    ],
  },

  // PG-3: Item arrived damaged, seller offered replacement, buyer accepted
  {
    _m:{id:103,cat:"C11-Physical",label:"Physical — Damaged item, seller offered replacement, buyer accepted",exp:"beneficiary",auto:false},
    ctx:ctx({amount:"0.4",timeElapsedSinceDeposit:"8 days",createdAt:new Date(Date.now()-8*86400000).toISOString()}),
    ev:[
      ev(D,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Item arrived with cracked screen. Contacted seller same day with photos.",itemCondition:"Screen cracked on arrival. Photos: imgur.com/cracked-screen.",deliveryClaim:"partial",firstComplaintTime:"Day of arrival",requestedOutcome:"refund",requestedOutcomeReason:"Item was damaged."}),300),
      ev(B,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Shipped March 3rd, tracking 7489234567891. Item was packaged well. Offered to send a replacement immediately when buyer reported damage. Buyer said yes and replacement is in transit.",trackingNumber:"7489234567891",deliveryClaim:"complete",returnPolicyOffered:"yes"}),200),
    ],
  },

  // PG-4: Item arrived damaged, seller offered replacement, buyer REFUSED and wants refund
  {
    _m:{id:104,cat:"C11-Physical",label:"Physical — Damaged item, seller offered replacement, buyer refused",exp:"any",auto:false},
    ctx:ctx({amount:"0.6",timeElapsedSinceDeposit:"6 days",createdAt:new Date(Date.now()-6*86400000).toISOString()}),
    ev:[
      ev(D,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Item arrived with scratches. I want a full refund, not a replacement. Seller offered replacement but I don't trust them to send a good one.",itemCondition:"Scratches on the surface. Photos: imgur.com/scratches.",deliveryClaim:"partial",firstComplaintTime:"Day of arrival",requestedOutcome:"refund",requestedOutcomeReason:"I want my money back, not a replacement."}),180),
      ev(B,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Shipped with care, tracking 7489234567892. Offered full replacement immediately. Buyer declined. Scratches are cosmetic and do not affect function.",trackingNumber:"7489234567892",deliveryClaim:"complete",returnPolicyOffered:"yes"}),120),
    ],
  },

  // PG-5: Seller sent wrong item entirely
  {
    _m:{id:105,cat:"C11-Physical",label:"Physical — Wrong item shipped",exp:"depositor",auto:true},
    ctx:ctx({amount:"0.8",timeElapsedSinceDeposit:"7 days",createdAt:new Date(Date.now()-7*86400000).toISOString()}),
    ev:[
      ev(D,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Paid for a blue widget, received a red thingamajig. Completely wrong item. Photo: imgur.com/wrong-item. Contacted seller immediately.",itemCondition:"Wrong item entirely. SKU doesn't match order.",deliveryClaim:"partial",firstComplaintTime:"Day of arrival",requestedOutcome:"refund",requestedOutcomeReason:"Wrong item received."}),240),
      ev(B,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Shipped what I had in stock. I apologize for the mix-up. Will accept return.",trackingNumber:"7489234567893",deliveryClaim:"partial",returnPolicyOffered:"yes"}),90),
    ],
  },

  // PG-6: Buyer claims item didn't arrive, tracking shows delivered
  {
    _m:{id:106,cat:"C11-Physical",label:"Physical — Buyer claims non-arrival but tracking shows delivered (fraud flag)",exp:"beneficiary",auto:true},
    ctx:ctx({amount:"1.5",timeElapsedSinceDeposit:"12 days",createdAt:new Date(Date.now()-12*86400000).toISOString()}),
    ev:[
      ev(D,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"The item never arrived. I checked my mailbox every day.",deliveryClaim:"none",requestedOutcome:"refund",requestedOutcomeReason:"Item never received."}),300),
      ev(B,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Shipped March 5th. FedEx tracking 7489234567894 shows delivered March 8th at 2:14pm, signed by A. Johnson at buyer address. Delivery photo attached by carrier: fedex.com/track/7489234567894. Buyer's signature is on file with carrier.",trackingNumber:"7489234567894",deliveryClaim:"complete",returnPolicyOffered:"no"}),180),
    ],
  },

  // PG-7: Buyer returns item, tracking confirms, refund warranted
  {
    _m:{id:107,cat:"C11-Physical",label:"Physical — Buyer returned item with tracking confirmed",exp:"depositor",auto:false},
    ctx:ctx({amount:"0.7",timeElapsedSinceDeposit:"15 days",createdAt:new Date(Date.now()-15*86400000).toISOString()}),
    ev:[
      ev(D,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Item arrived defective — motor doesn't work. Seller agreed to refund if returned. I shipped back March 10th, USPS tracking 9400100000000000000000, confirmed delivered March 13th.",itemCondition:"Motor failed immediately on first use.",deliveryClaim:"partial",firstComplaintTime:"Day of arrival",requestedOutcome:"refund",requestedOutcomeReason:"Defective item returned to seller."}),600),
      ev(B,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Shipped originally March 5th. Buyer reported defect. I agreed to refund upon return. Return confirmed received March 13th per USPS tracking.",trackingNumber:"9400100000000000000000",deliveryClaim:"complete",returnPolicyOffered:"yes"}),300),
    ],
  },

  // PG-8: Item never shipped, seller claims it was but can't provide tracking
  {
    _m:{id:108,cat:"C11-Physical",label:"Physical — Seller claims shipped but no tracking exists",exp:"depositor",auto:true},
    ctx:ctx({amount:"0.9",timeElapsedSinceDeposit:"21 days",createdAt:new Date(Date.now()-21*86400000).toISOString()}),
    ev:[
      ev(D,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Paid March 1st. Nothing arrived after 21 days. Seller says it was shipped but cannot provide any tracking.",deliveryClaim:"none",firstComplaintTime:"March 14th",requestedOutcome:"refund",requestedOutcomeReason:"Item never arrived and seller cannot prove it was shipped."}),1440),
      ev(B,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"I shipped it but my tracking slip got lost. It should have arrived by now. Maybe lost in mail.",trackingNumber:"",deliveryClaim:"complete",returnPolicyOffered:"no"}),60),
    ],
  },

  // PG-9: Item as described, buyer just didn't like it (buyer's remorse)
  {
    _m:{id:109,cat:"C11-Physical",label:"Physical — Item as described, buyer remorse",exp:"beneficiary",auto:true},
    ctx:ctx({amount:"0.3",timeElapsedSinceDeposit:"9 days",createdAt:new Date(Date.now()-9*86400000).toISOString()}),
    ev:[
      ev(D,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Item arrived. It's exactly as described in the listing but I just don't like it. I've changed my mind.",itemCondition:"No damage or defects. Just not what I wanted aesthetically.",deliveryClaim:"complete",requestedOutcome:"refund",requestedOutcomeReason:"I changed my mind after receiving it."}),200),
      ev(B,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Shipped March 3rd, tracking 7489234567895, delivered March 6th. Item matches description exactly. Buyer confirmed in message it arrived fine.",trackingNumber:"7489234567895",deliveryClaim:"complete",returnPolicyOffered:"no"}),300),
    ],
  },

  // PG-10: Counterfeit/fake item sent
  {
    _m:{id:110,cat:"C11-Physical",label:"Physical — Counterfeit item sent (seller fraud)",exp:"depositor",auto:true},
    ctx:ctx({amount:"2.0",timeElapsedSinceDeposit:"8 days",createdAt:new Date(Date.now()-8*86400000).toISOString()}),
    ev:[
      ev(D,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Purchased what was listed as an authentic Rolex watch. Item arrived and is clearly a fake — the movement is wrong, the crown logo is misspelled, and a jeweler confirmed it is counterfeit. Photos: imgur.com/fake-watch. Jeweler certificate: imgur.com/jeweler-cert.",itemCondition:"Counterfeit. Jeweler certified fake. Serial number doesn't exist in Rolex database.",deliveryClaim:"partial",firstComplaintTime:"Day of arrival",requestedOutcome:"refund",requestedOutcomeReason:"Counterfeit item, not as described."}),300),
    ],
  },

  // PG-11: Seller shipped late past critical deadline (event/gift)
  {
    _m:{id:111,cat:"C11-Physical",label:"Physical — Late shipment past critical deadline (birthday gift)",exp:"depositor",auto:false},
    ctx:ctx({amount:"0.4",timeElapsedSinceDeposit:"14 days",createdAt:new Date(Date.now()-14*86400000).toISOString()}),
    ev:[
      ev(D,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Ordered as a birthday gift needed by March 10th. Told seller deadline explicitly. Item shipped March 12th, arrived March 15th — 5 days after the birthday.",deliveryClaim:"complete",firstComplaintTime:"March 10th when it didn't arrive",requestedOutcome:"refund",requestedOutcomeReason:"Arrived too late for its purpose."}),600),
      ev(B,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Shipped March 12th, tracking 7489234567896. Item was delayed at the warehouse. I shipped as soon as I could. Buyer mentioned a deadline but I couldn't guarantee it.",trackingNumber:"7489234567896",deliveryClaim:"complete",returnPolicyOffered:"no"}),300),
    ],
  },

  // PG-12: Buyer refuses return despite seller offering it, claims refund
  {
    _m:{id:112,cat:"C11-Physical",label:"Physical — Seller offered return, buyer refuses to return but wants refund",exp:"beneficiary",auto:true},
    ctx:ctx({amount:"0.8",timeElapsedSinceDeposit:"10 days",createdAt:new Date(Date.now()-10*86400000).toISOString()}),
    ev:[
      ev(D,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Item has a minor scratch. I want a refund. Seller offered to take it back but I don't want to deal with shipping. Just give me my money.",itemCondition:"Minor surface scratch on corner.",deliveryClaim:"partial",firstComplaintTime:"Day of arrival",requestedOutcome:"refund",requestedOutcomeReason:"I don't want the hassle of returning it."}),180),
      ev(B,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Shipped March 5th, tracking 7489234567897, delivered March 7th. Offered full return including prepaid shipping label. Buyer refuses to return item but wants money back. I cannot refund without receiving the item.",trackingNumber:"7489234567897",deliveryClaim:"complete",returnPolicyOffered:"yes"}),240),
    ],
  },

  // PG-13: Partial shipment — only some items in order arrived
  {
    _m:{id:113,cat:"C11-Physical",label:"Physical — Partial shipment, half the order arrived",exp:"any",auto:false},
    ctx:ctx({amount:"1.2",timeElapsedSinceDeposit:"12 days",createdAt:new Date(Date.now()-12*86400000).toISOString()}),
    ev:[
      ev(D,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Ordered 10 units. Only 5 arrived. Box was sealed. Contacted seller who says rest is coming in a second shipment.",deliveryClaim:"partial",firstComplaintTime:"Day of arrival",requestedOutcome:"refund",requestedOutcomeReason:"Half the order missing."}),400),
      ev(B,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Shipped 5 units on March 5th (tracking 7489234567898) and remaining 5 on March 8th (tracking 7489234567899). Both confirmed delivered. Buyer signed for first package.",trackingNumber:"7489234567898, 7489234567899",deliveryClaim:"complete",returnPolicyOffered:"no"}),200),
    ],
  },

  // PG-14: Seller shipped to wrong address
  {
    _m:{id:114,cat:"C11-Physical",label:"Physical — Seller shipped to wrong address",exp:"depositor",auto:false},
    ctx:ctx({amount:"0.6",timeElapsedSinceDeposit:"14 days",createdAt:new Date(Date.now()-14*86400000).toISOString()}),
    ev:[
      ev(D,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Gave my correct address on March 1st. Tracking shows delivered to a completely different city. I never received anything.",deliveryClaim:"none",firstComplaintTime:"March 9th when tracking showed wrong delivery",requestedOutcome:"refund",requestedOutcomeReason:"Delivered to wrong address, not mine."}),600),
      ev(B,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Shipped to the address the buyer provided. Tracking 7489234567900 shows delivered. If the address was wrong that is the buyer's fault.",trackingNumber:"7489234567900",deliveryClaim:"complete",returnPolicyOffered:"no"}),180),
    ],
  },

  // PG-15: Physical item, both parties behaving well, genuine dispute about condition at shipping
  {
    _m:{id:115,cat:"C11-Physical",label:"Physical — Genuine condition dispute, both parties reasonable",exp:"any",auto:false},
    ctx:ctx({amount:"0.5",timeElapsedSinceDeposit:"9 days",createdAt:new Date(Date.now()-9*86400000).toISOString()}),
    ev:[
      ev(D,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Item arrived with a dent on the side. It works but is clearly damaged. I complained immediately.",itemCondition:"Dent on left side panel. Photos: imgur.com/dent. Arrived March 8th.",deliveryClaim:"partial",firstComplaintTime:"Day of arrival — March 8th",requestedOutcome:"refund",requestedOutcomeReason:"Item arrived damaged. It was not like this in the listing photos."}),300),
      ev(B,"INTAKE_JSON:"+JSON.stringify({goodsType:"physical",actionsTimeline:"Item was in perfect condition when shipped March 5th. Photos taken before shipping: imgur.com/pre-ship. Tracking 7489234567901. Item was packaged with bubble wrap. The dent may have occurred during transit, not at my end.",trackingNumber:"7489234567901",deliveryClaim:"complete",returnPolicyOffered:"yes",itemCondition:"Item was pristine before shipping. Photos prove this."}),250),
    ],
  },
];`;

const OLD_SCENARIOS_END = `];

// ─── Runner ──────────────────────────────────────────────────────────────────`;

if (!v3.includes(OLD_SCENARIOS_END)) {
  console.error("❌ Could not find end of scenarios array");
  process.exit(1);
}

v3 = v3.replace(OLD_SCENARIOS_END, PHYSICAL_SCENARIOS + "\n" + OLD_SCENARIOS_END);
console.log("✅ Step 2: 15 physical goods scenarios added to v3 harness");

// Update total count in header
v3 = v3.replace(
  "   ${scenarios.length} scenarios | Model: claude-sonnet-4-5 | ${new Date().toISOString()}",
  "   ${scenarios.length} scenarios (incl. 15 physical goods) | Model: claude-sonnet-4-5 | ${new Date().toISOString()}"
);

fs.writeFileSync(V3, v3, "utf8");

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Add 3 physical goods cases to Golden 21
// ─────────────────────────────────────────────────────────────────────────────

const G21 = "/root/blockdag-escrow/oracle/arbiter-golden21.mjs";
let g21 = fs.readFileSync(G21, "utf8");

const OLD_G21_END = `];

// ─── Runner ───────────────────────────────────────────────────────────────────`;

const PHYSICAL_GOLDEN = `
  // ── Physical goods must-pass cases ──────────────────────────────────────────

  { id:201, label:"Physical — Shipped with tracking, buyer remorse — must RELEASE",
    exp:"beneficiary", checkFraud:false,
    doctrines:["physical_goods","acceptance_by_conduct","buyers_remorse"],
    expectChallenges: null,
    ctx:ctx({amount:"0.5",timeElapsedSinceDeposit:"10 days",createdAt:new Date(Date.now()-10*86400000).toISOString()}),
    ev:[
      ev(B,'INTAKE_JSON:{"goodsType":"physical","actionsTimeline":"Shipped March 3rd via FedEx. Tracking 7489234567890. Carrier confirmed delivered March 6th signed by buyer.","trackingNumber":"7489234567890","deliveryClaim":"complete","returnPolicyOffered":"yes"}',400),
      ev(D,'INTAKE_JSON:{"goodsType":"physical","actionsTimeline":"Item arrived fine. I just changed my mind and found a cheaper option elsewhere.","deliveryClaim":"complete","requestedOutcome":"refund","requestedOutcomeReason":"Changed my mind."}',200),
    ]},

  { id:202, label:"Physical — Never shipped, buyer disputes after 30 days — must REFUND",
    exp:"depositor", checkFraud:false,
    doctrines:["physical_goods","non_delivery","anticipatory_breach"],
    expectChallenges: null,
    ctx:ctx({amount:"1.0",timeElapsedSinceDeposit:"30 days",createdAt:new Date(Date.now()-30*86400000).toISOString()}),
    ev:[
      ev(D,'INTAKE_JSON:{"goodsType":"physical","actionsTimeline":"Paid March 1st. Sent my address. Nothing arrived after 30 days and seller stopped responding after 10 days.","deliveryClaim":"none","firstComplaintTime":"March 15th","requestedOutcome":"refund","requestedOutcomeReason":"Never arrived."}',2880),
      ev(B,'INTAKE_JSON:{"goodsType":"physical","actionsTimeline":"I shipped it but lost the tracking number.","trackingNumber":"","deliveryClaim":"complete","returnPolicyOffered":"no"}',60),
    ]},

  { id:203, label:"Physical — Buyer refuses return but wants refund — must RELEASE",
    exp:"beneficiary", checkFraud:false,
    doctrines:["physical_goods","return_path_offered","buyers_remorse"],
    expectChallenges: null,
    ctx:ctx({amount:"0.8",timeElapsedSinceDeposit:"10 days",createdAt:new Date(Date.now()-10*86400000).toISOString()}),
    ev:[
      ev(D,'INTAKE_JSON:{"goodsType":"physical","actionsTimeline":"Item has a scratch. I want a refund but I refuse to ship it back because it is too much hassle.","itemCondition":"Minor surface scratch.","deliveryClaim":"partial","firstComplaintTime":"Day of arrival","requestedOutcome":"refund","requestedOutcomeReason":"I don\\'t want to deal with returning it."}',180),
      ev(B,'INTAKE_JSON:{"goodsType":"physical","actionsTimeline":"Shipped March 5th tracking 7489234567897, delivered March 7th. Offered full return with prepaid label. Buyer refuses to return item but demands money back.","trackingNumber":"7489234567897","deliveryClaim":"complete","returnPolicyOffered":"yes"}',240),
    ]},
`;

if (!g21.includes(OLD_G21_END)) {
  console.error("❌ Could not find end of Golden 21 array");
  process.exit(1);
}
g21 = g21.replace(OLD_G21_END, PHYSICAL_GOLDEN + OLD_G21_END);
console.log("✅ Step 3: 3 physical goods scenarios added to Golden 21 (IDs 201-203)");

fs.writeFileSync(G21, g21, "utf8");

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Add physical goods template pool to fuzz/templates.json
// ─────────────────────────────────────────────────────────────────────────────

const TMPL = "/root/blockdag-escrow/oracle/fuzz/templates.json";
const tmpl = JSON.parse(fs.readFileSync(TMPL, "utf8"));

tmpl.physicalGoods = {
  "delivery_confirmed": [
    "Shipped via FedEx, tracking 7489 2345 6789. Carrier confirmed delivered March 6th, signed by recipient.",
    "USPS tracking 9400 1000 0000 0000 0000 01 shows delivered to buyer address on March 8th at 2:14pm.",
    "DHL Express tracking 1234567890 confirmed delivery with GPS coordinates matching buyer address.",
    "Shipping label created March 3rd. FedEx scan history shows pickup, transit, and delivery confirmation.",
    "Royal Mail tracking RM123456789GB shows delivered and signed for by J. Smith.",
    "UPS tracking 1Z 999 AA1 01 2345 6784 confirmed delivered. Delivery photo attached by carrier."
  ],
  "no_tracking": [
    "Seller claims item was shipped but cannot provide any tracking number or shipping receipt.",
    "No tracking number exists. Seller says they dropped it at the post office but have no proof.",
    "Seller provided a tracking number that returns no results in any carrier system.",
    "The tracking number given returns 'No information found' on FedEx, USPS, and UPS websites."
  ],
  "item_condition_defective": [
    "Item arrived with a cracked screen. Photos show the damage upon opening the box.",
    "The motor stopped working within 5 minutes of first use. Item is functionally defective.",
    "Item was listed as new but arrived with clear signs of previous use and wear.",
    "Screen has dead pixels across the top right corner. Defect visible in photos.",
    "Zipper is broken and cannot be repaired. Item is unusable for its intended purpose.",
    "Item arrived with cosmetic scratches inconsistent with the 'mint condition' listing."
  ],
  "item_condition_ok": [
    "Item arrived in exactly the condition shown in the listing photos.",
    "Packaging was intact. Item is undamaged and functions as described.",
    "All components present and working. Matches the listing description exactly.",
    "Buyer confirmed in initial message that item arrived fine before raising dispute later."
  ],
  "return_offered": [
    "I offered the buyer a full return including prepaid shipping label. They declined.",
    "Seller offered to accept the return or send a replacement. Both options were available.",
    "I agreed to take the item back and issue a refund upon receipt. Buyer has not shipped it back.",
    "Offered a free replacement shipped express. Buyer declined and insisted on a cash refund."
  ],
  "return_refused_by_buyer": [
    "Buyer says returning it is too much hassle and they want a refund without sending it back.",
    "Buyer refuses to return the item. They want their money back but to keep the product.",
    "Buyer declined the return label and said they would dispute instead of shipping it back.",
    "Despite being offered a prepaid return label, buyer refuses to participate in the return process."
  ],
  "return_completed": [
    "Buyer returned the item via USPS tracking 9400 1000 0000 0000 0001 23, confirmed delivered.",
    "Return shipment arrived at seller address March 13th per carrier scan. Item received.",
    "FedEx tracking confirms return package delivered to seller March 15th, signed by seller."
  ],
  "wrong_item": [
    "Received a completely different product. The SKU and description do not match what arrived.",
    "Ordered a blue widget, received a red thingamajig. Wrong item entirely. Photo: imgur.com/wrong.",
    "The item in the box has a different model number than what was listed and agreed to.",
    "Sent to wrong address. Tracking shows delivered to a city I have never lived in."
  ],
  "counterfeit": [
    "Item is counterfeit. A certified jeweler confirmed it is not authentic. Certificate attached.",
    "Serial number does not exist in the manufacturer database. Item is fake.",
    "Logo is misspelled and the build quality is inconsistent with the genuine product.",
    "Independent authentication service confirmed counterfeit. Report: imgur.com/auth-report."
  ]
};

// Add physical goods signals to performance templates
tmpl.performance["0"].push(
  "No tracking number was ever provided. Item has not arrived after 30 days.",
  "Seller claims to have shipped but cannot produce any carrier receipt or tracking."
);
tmpl.performance["1"].push(
  "Item arrived but was damaged or not as described. Photos show the defect.",
  "Only half the ordered quantity arrived. Second shipment has not materialised."
);
tmpl.performance["2"].push(
  "Carrier tracking confirms delivery was signed for at buyer address.",
  "FedEx scan history shows item picked up, in transit, and delivered on schedule."
);

fs.writeFileSync(TMPL, JSON.stringify(tmpl, null, 2), "utf8");
console.log("✅ Step 4: Physical goods template pool added to fuzz/templates.json");

console.log("\n✅ Steps 2-4 complete. Run: node arbiter-golden21.mjs to verify.");
