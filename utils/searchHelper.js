export function normalizeQuery(query) {
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
    .replace(/[^a-z0-9_\-.\s]/g, "") // giữ lại _, -, .
    .replace(/\s+/g, " ") // bỏ khoảng trắng thừa
    .trim();
}

export function tokenize(query) {
  const normalized = normalizeQuery(query);
  const parts = normalized.split(" ");

  // Các biến thể
  const variations = [
    normalized, // "tien dung"
    parts.join(""), // "tiendung"
    parts.join("_"), // "tien_dung"
    parts.join("-"), // "tien-dung"
    parts.join("."), // "tien.dung"
  ];

  return [...new Set(variations)]; // loại bỏ trùng lặp
}
