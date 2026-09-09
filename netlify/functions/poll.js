const { getStore, connectLambda } = require("@netlify/blobs");

const STORE_NAME = "atenea-data";
const KEY = "poll";

exports.handler = async (event) => {
  const store = getStore(STORE_NAME);

  if (event.httpMethod === "GET") {
    const data = (await store.get(KEY, { type: "json" })) || { si: [], no: [] };
    return json(200, data);
  }

  if (event.httpMethod === "POST") {
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "JSON inválido" });
    }

    const { name, option } = body;
    if (!name || (option !== "si" && option !== "no")) {
      return json(400, { error: "Datos inválidos" });
    }

    const current = (await store.get(KEY, { type: "json" })) || { si: [], no: [] };
    current.si = (current.si || []).filter((n) => n !== name);
    current.no = (current.no || []).filter((n) => n !== name);
    current[option].push(name);

    await store.setJSON(KEY, current);
    return json(200, current);
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
