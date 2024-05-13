import fs from "node:fs/promises";

export const buildCourses = async () => {
  let f = await fs.readFile("../../.output/sections_1714588233309.json");
  let data = JSON.parse(f.toString());

  let buildings = new Set();
  let rooms = new Set();
  let sections = new Set();

  /**
   * @type {{[building: string]: {[room: string]: {[section: string]: {weekDays: number[], startTime: string, endTime: string}}}}}
   */
  let formatted = {};

  for (const [course, courseData] of Object.entries(data)) {
    let sections = courseData.TermsAndSections[0].Sections;
    console.log(sections);
    for (const sectionData of sections) {
      const section = sectionData.Section;
      const meetings = section.FormattedMeetingTimes;
      console.log(meetings);
      for (const meeting of meetings) {
        /**
         * @type string
         */
        const building = meeting.BuildingDisplay;
        /**
         * @type string
         */
        const room = meeting.RoomDisplay;
        /**
         * @type string
         */
        const secName = section.SectionNameDisplay;

        if (!formatted[building]) {
          formatted[building] = {};
        }

        if (!formatted[building][room]) {
          formatted[building][room] = {};
        }

        formatted[building][room][secName] = {
          // TODO: does work?
          weekDays: meeting.Days,
          startTime: meeting.StartTime,
          endTime: meeting.EndTime,
        };
      }
    }
  }

  fs.writeFile(`../../.output/formatted_${new Date().getUTCMilliseconds()}.json`, JSON.stringify(formatted, null, 2));
};

buildCourses();
