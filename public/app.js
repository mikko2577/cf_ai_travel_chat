const chatBox = document.getElementById("chat-box");
const input = document.getElementById("message");
const sendBtn = document.getElementById("send-btn");

function parseItinerary(text) {
  const regex = /Day\s*(\d+)\s*:\s*([\s\S]*?)(?=Day\s*\d+\s*:|$)/gi;
  const days = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    days.push({
      day: match[1].trim(),
      plan: match[2].trim()
    });
  }

  return days;
}

function renderPlanContent(plan) {
  const wrapper = document.createElement("div");
  wrapper.className = "timeline-plan";

  const lines = plan
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  const bulletLines = lines.filter((line) => line.startsWith("-"));

  if (bulletLines.length > 0) {
    const ul = document.createElement("ul");
    ul.className = "timeline-list";

    lines.forEach((line) => {
      if (line.startsWith("-")) {
        const li = document.createElement("li");
        li.textContent = line.replace(/^-+\s*/, "");
        ul.appendChild(li);
      } else {
        const note = document.createElement("div");
        note.className = "timeline-note";
        note.textContent = line;
        wrapper.appendChild(note);
      }
    });

    wrapper.appendChild(ul);
    return wrapper;
  }

  wrapper.textContent = plan;
  return wrapper;
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
    fallback.textContent = text;
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

    const planContent = renderPlanContent(item.plan);

    content.appendChild(dayLabel);
    content.appendChild(planContent);

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