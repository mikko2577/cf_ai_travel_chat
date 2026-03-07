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

Create a detailed day-by-day travel itinerary.

Output rules:
- Use exactly this structure: Day 1:, Day 2:, Day 3:
- Under each day, use bullet points that begin with "-"
- Include Morning, Afternoon, and Evening as separate bullet points
- Add 1 extra bullet point for food, transportation, or local tip when relevant
- Mention specific landmarks, museums, neighborhoods, or attractions
- Make each bullet point informative, not just one short phrase
- Keep the itinerary practical and easy to follow
- Write in clear natural English
- Do not respond in one paragraph
- Do not skip bullet points

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

      if (!reply) {
        reply =
`Day 1:
- Morning: Start at Boston Common and begin walking the Freedom Trail. Visit major historic landmarks such as the Massachusetts State House and Paul Revere's House to get an overview of Boston's colonial history.
- Afternoon: Continue to Quincy Market and Faneuil Hall, where you can explore food stalls, local shops, and the lively pedestrian area. This is a convenient place to combine sightseeing with lunch.
- Evening: Have dinner at Legal Sea Foods or another classic seafood restaurant nearby, then enjoy a relaxed walk around the downtown or waterfront area.
- Tip: Wear comfortable walking shoes because many of the historic sites in this area are best explored on foot.

Day 2:
- Morning: Visit the Museum of Fine Arts and spend a few hours exploring its American, Asian, and European collections. This is one of Boston's most well-known museums and works well as the centerpiece of the day.
- Afternoon: Head to the Isabella Stewart Gardner Museum, which offers a more intimate and unique museum experience with its famous courtyard and personal collection.
- Evening: Walk through Back Bay, stop by the Boston Public Library, and explore Newbury Street for shopping, architecture, and cafes before dinner.
- Food suggestion: Back Bay has many restaurants where you can try seafood, pasta, or modern American cuisine in a more relaxed evening setting.

Day 3:
- Morning: Take the Red Line to Cambridge and explore Harvard Square. Walk through the Harvard campus, browse local bookstores, and enjoy coffee or brunch in the area.
- Afternoon: Visit the MIT area or take a scenic walk along the Charles River. If you want a slower pace, spend time in a cafe or small museum nearby.
- Evening: End your trip in the Seaport District, where you can enjoy waterfront views, modern buildings, and a final seafood dinner before taking an evening walk by the harbor.
- Transportation tip: Use the MBTA subway to move between downtown Boston, Cambridge, and the Seaport efficiently without relying on a car.`;
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