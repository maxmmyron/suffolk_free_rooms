import type { PageLoad } from "./$types";

export const load: PageLoad = async () => {
  let courses = await import("$lib/coruse_meetings.json");
  return {
    courses: courses.default,
  };
};
