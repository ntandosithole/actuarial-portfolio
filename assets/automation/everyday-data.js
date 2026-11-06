/* Synthetic scenarios and AI-authored worked examples; not saved API responses. */
(function (root) {
  const demos = [
  {
    "id": "notes-to-handover",
    "title": "Rough Notes → Clear Handover",
    "tag": "Organise the loose ends",
    "summary": "Turn scattered notes into decisions, actions and questions without inventing owners or deadlines.",
    "why": "A short handover is easy to postpone. The useful AI step is separating what was agreed from what someone merely suggested.",
    "labels": [
      "Rough notes"
    ],
    "instruction": "Turn the notes into a short handover with Decisions, Actions, and Open questions. For each action show the owner and deadline only when explicitly stated; otherwise write Unassigned or Not stated. Preserve tentative wording, dependencies and unresolved questions. Quote the source phrase supporting each action. Do not turn a suggestion into a commitment.",
    "check": "Check every action against its source phrase. Confirm that suggestions remain tentative and that missing owners and dates stay visible.",
    "examples": [
      {
        "name": "Team catch-up",
        "inputs": [
          "Tuesday catch-up. Agreed: keep the current intake form for this month. Sam will send the revised checklist by Thursday. Need to check who owns the shared mailbox. Maybe Priya can cover next week? Export still missing; report can only be finished after it arrives."
        ],
        "output": "DECISION\nKeep the current intake form for this month.\n\nACTIONS\n• Send the revised checklist — Sam; Thursday (calendar date not stated). Source: “Sam will send the revised checklist by Thursday.”\n• Confirm the shared mailbox owner — Unassigned; deadline not stated. Source: “Need to check who owns the shared mailbox.”\n• Finish the report once the export arrives — Unassigned; deadline not stated. Source: “report can only be finished after it arrives.”\n\nOPEN QUESTIONS\n• Can Priya cover next week? This is a suggestion, not an agreed assignment.\n• Who will supply the missing export, and when?"
      },
      {
        "name": "Community event",
        "inputs": [
          "Planning notes: hall booked for 14 November. Lee to check chairs, no date agreed. Jo offered to print signs if we send final wording. We have not picked a start time. Bring spare extension leads? Budget still needs approval."
        ],
        "output": "DECISION / CONFIRMED STATUS\nHall booked for 14 November; year not stated.\n\nACTIONS\n• Check chairs — Lee; deadline not stated. Source: “Lee to check chairs, no date agreed.”\n• If Jo’s offer is accepted, send final wording for signs — Unassigned; deadline not stated. This is a dependency, not an agreed assignment. Source: “Jo offered to print signs if we send final wording.”\n\nOPEN QUESTIONS\n• Will Jo’s conditional offer to print signs be accepted, and when is the wording needed?\n• What is the start time?\n• Are spare extension leads needed, and who would bring them?\n• Who approves the budget, and when?"
      }
    ]
  },
  {
    "id": "instruction-check",
    "title": "Instructions → Missing Questions",
    "tag": "Find the unstated assumptions",
    "summary": "Read a short process as a newcomer and surface the questions its author forgot to answer.",
    "why": "People who know a process often leave out the steps they take for granted. AI can help you test whether someone else could follow the instructions.",
    "labels": [
      "Instructions to review"
    ],
    "instruction": "Review these instructions from the perspective of a newcomer. List the specific ambiguities, contradictions and missing dependencies that could stop someone following them. For each, quote the relevant source phrase and ask one concrete clarification question. Then provide a short checklist using only stated instructions, marking unresolved details as To confirm. Do not invent company policy, deadlines, approval authority or system behaviour.",
    "check": "Keep genuine gaps separate from preferences. Verify that the checklist does not fill missing details with plausible but unsupported rules.",
    "examples": [
      {
        "name": "Monthly file handoff",
        "inputs": [
          "Download the latest file from the shared folder. Remove old rows and save the final version. Send it to the usual reviewers before lunch. Once approved, replace the copy in the reporting folder."
        ],
        "output": "QUESTIONS TO RESOLVE\n• “latest file” — Which folder and filename identify the correct reporting period?\n• “Remove old rows” — What exact rule defines an old row?\n• “save the final version” — Where should the review copy go, and what should it be called?\n• “usual reviewers” — Who must review it, and whose approval is needed?\n• “before lunch” — What date, time and time zone apply?\n• “replace the copy” — Which file should be replaced, and should a previous version be retained?\n\nCHECKLIST\n1. Download the file — location and selection rule: To confirm.\n2. Remove old rows — removal rule: To confirm.\n3. Save the review copy — location and name: To confirm.\n4. Send for review — recipients and deadline: To confirm.\n5. After approval, replace the reporting copy — approval requirements and target: To confirm."
      },
      {
        "name": "Volunteer welcome guide",
        "inputs": [
          "Arrive 20 minutes early and collect the keys from reception. Reception opens at 09:00. The first session starts at 09:00. New volunteers should complete induction before helping. Ask the coordinator if there is a problem."
        ],
        "output": "QUESTIONS TO RESOLVE\n• “20 minutes early” and “first session starts at 09:00” imply arrival at 08:40, but “Reception opens at 09:00” — How can volunteers collect keys before the session?\n• “complete induction before helping” — Where and when is induction available, and how is completion confirmed?\n• “Ask the coordinator” — Who is the coordinator and how can volunteers contact them?\n\nCHECKLIST\n1. Arrive at 08:40 for the 09:00 session; confirm the access arrangement.\n2. Collect keys from reception — early collection: To confirm.\n3. Complete induction before helping — arrangements: To confirm.\n4. Contact the coordinator for problems — contact details: To confirm."
      }
    ]
  },
  {
    "id": "change-brief",
    "title": "Two Versions → What Changed",
    "tag": "Make small edits visible",
    "summary": "Explain changes to dates, commitments and conditions that are easy to miss when rereading a document.",
    "why": "A paragraph can look almost unchanged while its meaning shifts. AI can draft a change brief that pairs each claim with the old and new wording.",
    "labels": [
      "Earlier version",
      "Revised version"
    ],
    "instruction": "Compare the earlier and revised versions. Identify substantive changes to dates, quantities, scope, obligations and conditions. For every finding quote both versions (or say Not present), explain the practical effect, and flag anything that needs confirmation. Distinguish a proposal from a confirmed commitment. Do not infer intent or claim legal significance. End with a short checklist for a human reviewer.",
    "check": "Read both versions alongside the brief. Verify numbers, negations and qualifiers such as “may”, “must”, “proposed” and “subject to”.",
    "examples": [
      {
        "name": "Event arrangements",
        "inputs": [
          "The workshop is on 12 November, 10:00–12:00. Registration includes lunch. Participants may bring one guest. Please respond by 5 November.",
          "The workshop is on 19 November, 10:00–12:00. Registration includes refreshments. Participants must register guests in advance, up to one guest each. Please respond by 9 November."
        ],
        "output": "WHAT CHANGED\n• Date: “12 November” → “19 November”. The workshop moves seven days later; year is not stated.\n• Catering: “includes lunch” → “includes refreshments”. Lunch is no longer explicitly included; confirm what will be served.\n• Guests: “may bring one guest” → “must register guests in advance, up to one guest each”. The one-guest limit remains, with a new advance-registration requirement. The registration method and guest deadline are not stated.\n• Reply deadline: “5 November” → “9 November”. Responses are requested four days later.\n\nUNCHANGED\nThe stated time is still 10:00–12:00.\n\nREVIEW CHECKLIST\nConfirm the year, catering, and guest-registration details before updating the invitation."
      },
      {
        "name": "Delivery update",
        "inputs": [
          "We will deliver all 20 chairs on Friday. Delivery is included. Assembly is optional.",
          "We propose delivering 12 chairs on Friday, with the remaining 8 on Monday, subject to stock confirmation. Delivery is included for the first trip. Assembly is required before use."
        ],
        "output": "WHAT CHANGED\n• Commitment: “We will deliver” → “We propose delivering … subject to stock confirmation”. A firm statement becomes a conditional proposal.\n• Quantity and timing: “all 20 chairs on Friday” → “12 chairs on Friday” and “remaining 8 on Monday”. The total remains 20, split across two proposed deliveries. Calendar dates are not stated.\n• Delivery charge: “Delivery is included” → “included for the first trip”. The second-trip charge is unspecified; do not assume it is free or chargeable.\n• Assembly: “optional” → “required before use”. Assembly is now a prerequisite to use; who performs it is not stated.\n\nREVIEW CHECKLIST\nConfirm stock, acceptance of the proposed split, calendar dates, any second-trip charge and assembly responsibility."
      }
    ]
  }
];
  if (typeof module !== "undefined" && module.exports) module.exports = demos;
  else root.EverydayDemos = demos;
}(typeof window !== "undefined" ? window : globalThis));
