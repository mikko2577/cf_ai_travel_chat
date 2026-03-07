const chatBox = document.getElementById("chat-box");
const input = document.getElementById("message");
const sendBtn = document.getElementById("send-btn");

function cleanText(text) {
  return text
    .replace(/\*\*/g, "")
    .replace(/\r/g, "")
    .trim();
}

function parseItinerary(text) {
  const regex = /Day\s*(\d+)\s*:?\s*([\s\S]*?)(?=Day\s*\d+\s*:|$)/gi;
  const days = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    days.push({
      day: parseInt(match[1]),
      plan: match[2].trim()
    });
  }

  const fallback = {
    1: "- Morning: Walk the Freedom Trail and explore Boston Common.\n- Afternoon: Visit Quincy Market and nearby historic sites.\n- Evening: Enjoy seafood and waterfront views.\n- Food: Try clam chowder or lobster rolls.\n- Tip: Wear comfortable shoes for walking.",
    2: "- Morning: Visit the Museum of Fine Arts.\n- Afternoon: Explore the Isabella Stewart Gardner Museum.\n- Evening: Walk through Back Bay and Newbury Street.\n- Food: Have dinner in Back Bay.\n- Tip: Use the Green Line for museum access.",
    3: "- Morning: Explore Harvard Square in Cambridge.\n- Afternoon: Walk along the Charles River or visit MIT.\n- Evening: Head to the Seaport District for harbor views.\n- Food: Try a seafood restaurant in Seaport.\n- Tip: Visit around sunset for better views."
  };

  const dayMap = {};
  days.forEach(d => {
    dayMap[d.day] = d.plan;
  });

  const result = [];
  for (let i = 1; i <= 3; i++) {
    result.push({
      day: i,
      plan: dayMap[i] || fallback[i]
    });
  }

  return result;
}

function renderAssistantTimeline(text) {
  const days = parseItinerary(text);

  const wrapper = document.createElement("div");
  wrapper.className = "timeline-wrapper";

  const title = document.createElement("div");
  title.className = "timeline-title";
  title.textContent = "AI Travel Plan";
  wrapper.appendChild(title);

  if (days.length === 0) {
    const fallback = document.createElement("div");
    fallback.className = "timeline-fallback";
    fallback.textContent = cleanText(text);
    wrapper.appendChild(fallback);
    return wrapper;
  }

  const timeline = document.createElement("div");
  timeline.className = "timeline";

  days.forEach((item) => {
    const row = document.createElement("div");
    row.className = "timeline-item";

    const dot = document.createElement("div");
    dot.className = "timeline-dot";

    const content = document.createElement("div");
    content.className = "timeline-content";

    const dayLabel = document.createElement("div");
    dayLabel.className = "timeline-day";
    dayLabel.textContent = `Day ${item.day}`;

    const planText = document.createElement("div");
    planText.className = "timeline-plan";
    planText.textContent = item.plan;

    content.appendChild(dayLabel);
    content.appendChild(planText);

    row.appendChild(dot);
    row.appendChild(content);
    timeline.appendChild(row);
  });

  wrapper.appendChild(timeline);
  return wrapper;
}

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = role === "user" ? "msg user" : "msg assistant";

  if (role === "assistant") {
    const block = document.createElement("div");
    block.className = "assistant-block";

    const label = document.createElement("div");
    label.className = "assistant-label";
    label.textContent = "AI:";

    block.appendChild(label);
    block.appendChild(renderAssistantTimeline(String(text)));
    div.appendChild(block);
  } else {
    const bubble = document.createElement("div");
    bubble.className = "user-bubble";
    bubble.textContent = `You: ${String(text)}`;
    div.appendChild(bubble);
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addMessage("user", message);
  input.value = "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();

    if (!res.ok) {
      addMessage("assistant", `Error: ${data.details || data.error || "Unknown error"}`);
      return;
    }

    const reply =
      data.reply ??
      data.response ??
      data.result?.response ??
      data.text ??
      data.output_text ??
      "No response received.";

    addMessage("assistant", reply);
  } catch (error) {
    addMessage("assistant", `Error: ${String(error)}`);
  }
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});