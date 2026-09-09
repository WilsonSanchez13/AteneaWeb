const { getStore, connectLambda } = require("@netlify/blobs");

const STORE_NAME = "atenea-data";
const KEY = "messages";

exports.handler = async (event) => {
  const store = getStore(STORE_NAME);

  if (event.httpMethod === "GET") {
    const data = (await store.get(KEY, { type: "json" })) || [];
    return json(200, data);
  }

  if (event.httpMethod === "POST") {
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "JSON inválido" });
    }

    const current = (await store.get(KEY, { type: "json" })) || [];

    switch (body.action) {
      case "add": {
        const { type, target, author, title, content } = body.data || {};
        if (!author || !title || !content) {
          return json(400, { error: "Faltan campos obligatorios" });
        }
        const newMessage = {
          id: makeId(),
          type: type === "special" ? "especial" : "general",
          target: target || "",
          author,
          title,
          content,
          likes: 0,
          gifts: [],
          comments: [],
          date: new Date().toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }),
          createdAt: Date.now()
        };
        current.unshift(newMessage);
        await store.setJSON(KEY, current);
        return json(200, newMessage);
      }

      case "like": {
        const msg = current.find((m) => m.id === body.id);
        if (!msg) return json(404, { error: "Mensaje no encontrado" });
        msg.likes = (msg.likes || 0) + 1;
        await store.setJSON(KEY, current);
        return json(200, msg);
      }

      case "comment": {
        const msg = current.find((m) => m.id === body.id);
        if (!msg) return json(404, { error: "Mensaje no encontrado" });
        if (!body.author || !body.text) return json(400, { error: "Faltan campos" });
        msg.comments = msg.comments || [];
        msg.comments.push({ author: body.author, text: body.text });
        await store.setJSON(KEY, current);
        return json(200, msg);
      }

      case "gift": {
        const msg = current.find((m) => m.id === body.id);
        if (!msg) return json(404, { error: "Mensaje no encontrado" });
        if (!body.gift) return json(400, { error: "Falta el regalo" });
        msg.gifts = msg.gifts || [];
        msg.gifts.push(body.gift);
        await store.setJSON(KEY, current);
        return json(200, msg);
      }

      default:
        return json(400, { error: "Acción no reconocida" });
    }
  }

  return json(405, { error: "Método no permitido" });
};

function json(statusCode, data) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
