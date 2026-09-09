const { getStore, connectLambda } = require("@netlify/blobs");

const STORE_NAME = "atenea-data";
const KEY = "secretFriends";

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

    const { name, contact } = body;
    if (!name || !contact) {
      return json(400, { error: "Faltan campos obligatorios" });
    }

    const current = (await store.get(KEY, { type: "json" })) || [];
    const entry = { id: makeId(), name, contact, createdAt: Date.now() };
    current.unshift(entry);
    await store.setJSON(KEY, current);
    return json(200, entry);
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
