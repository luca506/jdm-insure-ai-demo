const messages = document.getElementById("chatMessages");
const form = document.getElementById("chatForm");
const input = document.getElementById("chatInput");
const panel = document.getElementById("chatPanel");
const toggle = document.getElementById("chatToggle");
const minimizeBtn = document.getElementById("minimizeBtn");

const state = {
  context: {
    location: "",
    urgency: false,
    team: "sales",
  },
  leadCapture: {
    active: false,
    reason: "",
    fields: [
      "Business name",
      "Contact person name",
      "Role/title",
      "Email",
      "Phone",
      "Location (country)",
      "Brief description of inquiry",
    ],
    data: {},
    index: 0,
  },
};

const typoMap = {
  garman: "garmin",
  garminn: "garmin",
  fitbitt: "fitbit",
  tonie: "tonies",
};

const kb = {
  brands: "Garmin, Fitbit, Tonies, Echelon, Austere, SureFire Gaming, AENO, and 15+ other leading technology brands.",
  company: "JDM Products is an award-winning B2B consumer electronics distributor founded in 1999 by Jonathan Moore.",
  logistics: "Pan-European freight network with facilities in Ireland and the UK.",
  marketing: "Social media support, co-marketing opportunities, and brand awareness campaigns.",
  sales: "Regional sales management teams across UK and Ireland serving 3000+ active accounts.",
  events: "Trade shows, B2B events, product training, and consumer events.",
  portal: "b2b.jdmproducts.com",
  phones: "Ireland: +353 1 2050500 | UK: +44 0203 4815711",
};

const normalize = (text) => {
  const cleaned = text.toLowerCase().trim();
  return cleaned
    .split(" ")
    .map((token) => typoMap[token] || token)
    .join(" ");
};

function bot(text) {
  append("bot", text);
}

function append(role, text) {
  const div = document.createElement("div");
  div.className = `bubble ${role}`;
  div.textContent = text;
  messages.append(div);
  messages.scrollTop = messages.scrollHeight;
}

function beginLeadCapture(reason, team = "sales") {
  state.leadCapture.active = true;
  state.leadCapture.reason = reason;
  state.leadCapture.team = team;
  state.leadCapture.data = {};
  state.leadCapture.index = 0;
  bot(`Great — I can route this to our ${team} team. Please share your ${state.leadCapture.fields[0]}.`);
}

function handleLeadCapture(answer) {
  const key = state.leadCapture.fields[state.leadCapture.index];
  state.leadCapture.data[key] = answer;
  state.leadCapture.index += 1;

  if (state.leadCapture.index < state.leadCapture.fields.length) {
    bot(`Thanks. Please provide: ${state.leadCapture.fields[state.leadCapture.index]}.`);
    return;
  }

  const name = state.leadCapture.data["Contact person name"] || "there";
  const contact = state.leadCapture.data["Email"] || state.leadCapture.data["Phone"] || "your contact details";
  const urgent = state.context.urgency ? " (priority flag added)" : "";
  bot(
    `Thanks ${name}! Someone from our ${state.leadCapture.team} team will contact you at ${contact} within 1 business day${urgent}.`
  );
  state.leadCapture.active = false;
}

function routeReply(raw) {
  const text = normalize(raw);

  state.context.urgency = /urgent|asap|immediately/.test(text) || state.context.urgency;
  if (/uk|united kingdom/.test(text)) {
    state.context.location = "UK";
  } else if (/ireland/.test(text)) {
    state.context.location = "Ireland";
  } else if (/eu|europe/.test(text)) {
    state.context.location = "EU";
  }

  if (state.leadCapture.active) {
    return handleLeadCapture(raw);
  }

  if (/reseller|retailer|partner|open an account|become a retailer|onboard/.test(text)) {
    bot(
      "Absolutely. To open a JDM trade account, please confirm: your retail business type, your location (Ireland, UK, or EU), and which brands you currently stock. We work with 3000+ active accounts."
    );
    return beginLeadCapture("retailer_onboarding", "sales");
  }

  if (/garmin|fitbit|tonies|echelon|austere|surefire|aeno|brands|distribute/.test(text)) {
    bot(`JDM currently distributes ${kb.brands}`);
    if (/stock|available|availability|in stock/.test(text)) {
      return bot(
        `For live stock levels, please log into your reseller portal at ${kb.portal} or I can have your account manager contact you.`
      );
    }
    return;
  }

  if (/portal|can't access|cannot access|login/.test(text)) {
    bot(`For portal access, please use ${kb.portal}/account/create or LOGIN from the portal homepage.`);
    return bot(`If you're still blocked, share your account name and I can escalate to support. ${kb.phones}`);
  }

  if (/order|where.*order|pricing|price|stock availability|stock level/.test(text)) {
    bot(
      `Your dedicated account manager can help with order status, pricing, and stock. Share your account name and I will route it now. Or call ${kb.phones}.`
    );
    return beginLeadCapture("existing_customer_support", "account management");
  }

  if (/services|marketing|logistics|training|events|sales management/.test(text)) {
    bot(`JDM services include: ${kb.logistics} ${kb.marketing} ${kb.sales} ${kb.events}`);
    bot("Would you like to speak with our team about any specific service?");
    return;
  }

  if (/cover|country|expanding|expansion|european distribution|region/.test(text)) {
    bot(
      "Our core markets are Ireland and the UK, and we have expanded to five additional EU countries. If you share your target region, I can connect a regional sales manager."
    );
    return beginLeadCapture("regional_expansion", "regional sales");
  }

  if (/interested|talk about|discuss|we'd like|we would like/.test(text)) {
    bot(
      "Great to hear. To qualify this quickly, please share business type, location, annual turnover/size, current brands stocked, and immediate vs future needs."
    );
    return beginLeadCapture("lead_qualification", "sales");
  }

  if (/consumer|buy for myself|personal purchase/.test(text)) {
    return bot("JDM is a B2B distributor and supplies trade partners only. If you represent a retail business, I can help you open an account.");
  }

  const regionNote =
    state.context.location === "UK"
      ? " Since you're in the UK, we can route this through our UK team."
      : state.context.location === "Ireland"
        ? " Since you're in Ireland, our Ireland team can pick this up quickly."
        : "";
  bot(`That's a great question. Let me connect you with the right person on our team.${regionNote}`);
  beginLeadCapture("fallback", "sales");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    return;
  }

  append("user", text);
  routeReply(text);
  input.value = "";
});

minimizeBtn.addEventListener("click", () => {
  panel.classList.add("minimized");
  toggle.classList.add("visible");
  toggle.setAttribute("aria-expanded", "false");
});

toggle.addEventListener("click", () => {
  panel.classList.remove("minimized");
  toggle.classList.remove("visible");
  toggle.setAttribute("aria-expanded", "true");
});

bot("Hi, I'm Michael from JDM Products. I can help with retailer onboarding, brands, stock queries, services, and regional expansion.");
bot(`Quick links: portal ${kb.portal}. Support lines: ${kb.phones}`);
