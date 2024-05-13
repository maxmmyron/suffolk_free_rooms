import type { PageLoad } from "./$types";

export const load: PageLoad = async () => {
  let buildings = await import("$lib/formatted_656.json");
  let data = buildings.default;
  return data;
};
