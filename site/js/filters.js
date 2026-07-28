// filters.js — 纯函数筛选，二期原样搬进 src/utils/

export function byKeyword(list, kw) {
  const k = (kw || "").trim().toLowerCase();
  if (!k) return list;
  return list.filter((item) => item.tag.toLowerCase().includes(k));
}
