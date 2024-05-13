import type { PageLoad } from "./$types";

export const load: PageLoad = async () => {
  const buildings = await import("$lib/formatted_656.json");
  const data = buildings.default;
  return data;
};
