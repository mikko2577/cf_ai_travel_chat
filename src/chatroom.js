function getFallbackPlan(userMessage) {
  const lower = userMessage.toLowerCase();

  if (lower.includes("boston")) {
    return `Day 1:
- Morning: Start at Boston Common and walk through the Public Garden to enjoy historic green spaces and classic city views.
- Afternoon: Visit the Museum of Fine Arts and spend time exploring its major American and European collections.
- Evening: Enjoy a sunset walk or harbor cruise near Boston Harbor for waterfront scenery and skyline views.
- Food: Try New England clam chowder or a lobster roll at a well-known seafood restaurant such as Legal Sea Foods.
- Tip: Use the Green Line or walk between central attractions to save time and enjoy the city atmosphere.

Day 2:
- Morning: Follow part of the Freedom Trail and visit major landmarks such as Faneuil Hall, the Old State House, and nearby historic sites.
- Afternoon: Explore Quincy Market and the surrounding downtown area for sightseeing, shopping, and casual local food.
- Evening: Head to the North End for dinner and enjoy the neighborhood's lively streets and historic character.
- Food: Try Italian pastries or cannoli in the North End after dinner.
- Tip: Wear comfortable shoes because this day includes a lot of walking through historic areas.

Day 3:
- Morning: Explore Harvard Square in Cambridge and walk through the Harvard campus for a classic academic Boston experience.
- Afternoon: Walk along the Charles River or visit the MIT area for open views, architecture, and a relaxed afternoon.
- Evening: End the trip in the Seaport District with waterfront views and dinner near the harbor.
- Food: Choose a seafood restaurant in Seaport for a final Boston meal with a view.
- Tip: Visit the Seaport around sunset for the best light and harbor photos.`;
  }

  return `Day 1:
- Morning: Start with a walk through the city center and visit a major landmark to get familiar with the area.
- Afternoon: Explore a museum, market, or well-known neighborhood that matches your interests.
- Evening: Enjoy a scenic walk and dinner at a popular local restaurant.
- Food: Try a regional specialty that the city is known for.
- Tip: Use public transit or walk when possible to save time.

Day 2:
- Morning: Visit a cultural or historic attraction and spend time exploring nearby streets or shops.
- Afternoon: Relax in a public park, waterfront area, or scenic viewpoint.
- Evening: Explore a lively neighborhood known for food, nightlife, or local atmosphere.
- Food: Choose a restaurant with local dishes or highly rated casual dining.
- Tip: Plan indoor attractions in the afternoon if the weather changes.

Day 3:
- Morning: Visit a second major attraction or a nearby district for a different side of the city.
- Afternoon: Spend time at a scenic area, riverwalk, harbor, or university district.
- Evening: End the trip with dinner and one final city view before returning.
- Food: Pick a restaurant with a view or a memorable final meal.
- Tip: Try to visit your last scenic stop near sunset for better photos.`;
}

function isGoodStructuredPlan(text) {
  if (!text) return false;

  const cleaned = text.replace(/\*\*/g, "").trim();

  const hasDay1 = /Day\s*1:/i.test(cleaned);
  const hasDay2 = /Day\s*2:/i.test(cleaned);
  const hasDay3 = /Day\s*3:/i.test(cleaned);

  const bulletCount = (cleaned.match(/^\s*-/gm) || []).length;

  return hasDay1 && hasDay2 && hasDay3 && bulletCount >= 12;
}

export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    try {
      if (request.method !== "POST") {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          {
            status: 405,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const body = await request.json();
      const userMessage = body.message?.trim();

      if (!userMessage) {
        return new Response(
          JSON.stringify({ error: "Message is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      let history = (await this.state.storage.get("history")) || [];
      history.push({ role: "user", content: userMessage });

      let reply = "";

      try {
        const aiResponse = await this.env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct",
          {
            prompt: `
You are a professional travel planner.

Generate a detailed travel itinerary for EXACTLY 3 days.

STRICT RULES:
- Output exactly:
Day 1:
Day 2:
Day 3:
- Under each day, write exactly 5 bullet points
- Every line must begin with "-"
- Include:
  - Morning activity
  - Afternoon activity
  - Evening activity
  - Food recommendation
  - Useful tip
- Use plain text only
- Do not use markdown bold
- Do not stop early
- Make each day different and practical

User request:
${userMessage}
`
          }
        );

        reply =
          aiResponse?.response ||
          aiResponse?.result?.response ||
          aiResponse?.text ||
          aiResponse?.output_text ||
          "";
      } catch (aiError) {
        console.error("Workers AI failed:", aiError);
      }

      if (!isGoodStructuredPlan(reply)) {
        reply = getFallbackPlan(userMessage);
      }

      history.push({ role: "assistant", content: reply });
      await this.state.storage.put("history", history);

      return new Response(
        JSON.stringify({
          reply,
          history
        }),
        {
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("ChatRoom error:", error);

      return new Response(
        JSON.stringify({
          error: "Server error",
          details: String(error)
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
}