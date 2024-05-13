<script lang="ts">
  import type { PageData } from "./$types";

  export let data: {
    [building: string]: {
      [room: string]: {
        [section: string]: {
          startTime: string;
          endTime: string;
          weekDays: number[];
        };
      };
    };
  };

  let date = new Date();

  /**
   * Returns a list of available rooms at a given timestamp
   *
   * @param timestamp - the timestamp to check against
   */
  const getAvailableRooms = (timestamp: number): string[] => {
    let availableRooms = [];

    for (const [building, rooms] of Object.entries(data)) {
      for (const [room, sections] of Object.entries(rooms)) {
        // if any section collides with our timestamp, then the room is not available
        let hasNoCollisions = Object.values(sections).every((secData) => {
          const localeStr = date.toLocaleDateString();

          const start = new Date(localeStr + " " + secData.startTime).getTime();
          const end = new Date(localeStr + " " + secData.endTime).getTime();

          if (timestamp >= start && timestamp <= end) return false;

          return true;
        });

        if (hasNoCollisions) availableRooms.push(`${building} ${room}`);
      }
    }

    return availableRooms;
  };

  /**
   * Returns the start and end timestamps of a given room's availability on a date at a time
   * @param building - the building name
   * @param room - the room code
   * @param timestamp - the timestamp to check.
   *
   * @throws {Error} if the room is not found
   * @throws {Error} if the room is not available at the given time
   */
  const getRoomDuration = (
    building: string,
    room: string,
    timestamp: number
  ): [number, number] => {
    let sections = data[building][room];
    if (!sections) {
      throw new Error(`Room ${building} ${room} not found`);
    }

    throw new Error("unimplemented");
  };
</script>

<div class="flex gap-2">
  <input
    type="datetime-local"
    on:input={(e) => {
      date = new Date(e.currentTarget.value);
    }}
  />
</div>

<div class="outer">
  <!-- all courses -->
  <main class="grid">
    {#each Object.entries(data) as [building, rooms]}
      <p>{building}</p>
      <div class="grid">
        {#each Object.entries(rooms) as [room, sections]}
          <p>{room}</p>
          <div class="grid">
            {#each Object.entries(sections) as [section, secData]}
              <p>{section}</p>
              <div>
                <p>START: {secData.startTime}</p>
                <p>END: {secData.endTime}</p>
                <p>DAYS: {secData.weekDays.join(",")}</p>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {/each}
  </main>

  <!-- available -->
  <aside>
    {#if date}
      <h2>Available Rooms</h2>
      <ul>
        {#each getAvailableRooms(date.getTime()) as room}
          <li>{room}</li>
        {/each}
      </ul>
    {:else}
      <p>Select a date to see available rooms</p>
    {/if}
  </aside>
</div>

<style>
  .grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: min-content 1fr;
  }

  p {
    text-wrap: nowrap;
  }

  .outer {
    display: flex;
  }

  .outer > * {
    width: 50%;
  }
</style>
