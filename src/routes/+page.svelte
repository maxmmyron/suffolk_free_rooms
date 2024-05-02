<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;

  $: maxTitleLen = Math.max(
    ...data.courses.map((course) => course.title.length)
  );

  $: maxSectionLen = Math.max(
    ...data.courses.flatMap((course) =>
      course.meetings.map((meeting) => meeting.section.length)
    )
  );
</script>

<input
  type="text"
  placeholder="Search..."
  on:input={(e) => {
    const search = e.currentTarget.value.toLowerCase();
    /**
     * @type {NodeListOf<HTMLTableRowElement>}
     */
    const courses = document.querySelectorAll(".course");

    courses.forEach((course) => {
      const title =
        course.querySelector("td:first-child")?.textContent?.toLowerCase() ??
        "";
      const section =
        course.querySelector(".section")?.textContent?.toLowerCase() ?? "";

      if (title.includes(search) || section.includes(search)) {
        // @ts-ignore
        course.style.display = "";
      } else {
        // @ts-ignore
        course.style.display = "none";
      }
    });
  }}
/>

<table>
  <thead>
    <tr>
      <th style="width: {maxTitleLen}ch;">Course</th>
      <th style="width: {maxSectionLen}ch;">Section</th>
      <th style="width: 60ch;">Meeting Time</th>
    </tr>
  </thead>
  {#each data.courses as course}
    {@const meetings = new Set(course.meetings.map((m) => m.section))}
    <tr style="border-top: 1px solid black;" class="course">
      <td>{course.title}</td>
      <td colspan="2">
        {#each meetings as meeting}
          {@const times = course.meetings
            .filter((m) => m.section === meeting)
            .map((m) => [m.startTime, m.endTime])}

          {@const locs = course.meetings
            .filter((m) => m.section === meeting)
            .map((m) => m.location)}

          {@const days = course.meetings
            .filter((m) => m.section === meeting)
            .map((m) => m.days)}

          <table style="width: 100%;">
            <tr>
              <td style="width: {maxSectionLen}ch;" class="section">
                {meeting}
              </td>
              <td style="width: 60ch;">
                {#each times as [startTime, endTime], i}
                  <p>{days[i]}: {startTime} - {endTime} @ {locs[i]}</p>
                {/each}
              </td>
            </tr>
          </table>
        {/each}
      </td>
    </tr>
  {/each}
</table>
