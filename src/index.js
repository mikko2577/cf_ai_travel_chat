import { ChatRoom } from "./chatroom.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat" && request.method === "POST") {
      const id = env.CHATROOM.idFromName("default-room");
      const stub = env.CHATROOM.get(id);
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  }
};

export { ChatRoom };