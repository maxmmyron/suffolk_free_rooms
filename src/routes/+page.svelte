<script lang="ts">
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

  let occupiedKey: [string, string];

  const getRelTime = (time: string) =>
    new Date(`${date.toLocaleDateString()} ${time}`).getTime();

  /**
   * Returns all free rooms for a given timestamp as a list of tuples (building, room)
   *
   * @param timestamp - the timestamp to check against
   */
  const getAvailableRooms = (timestamp: number): [string, string][] => {
    let availableRooms: [string, string][] = [];

    for (const [building, rooms] of Object.entries(data)) {
      for (const [room, sections] of Object.entries(rooms)) {
        // if any section collides with our timestamp, then the room is not
        // available
        const hasNoCollisions = Object.values(sections).every((secData) => {
          const localeStr = date.toLocaleDateString();

          const start = new Date(localeStr + " " + secData.startTime).getTime();
          const end = new Date(localeStr + " " + secData.endTime).getTime();

          if (timestamp >= start && timestamp <= end) return false;

          return true;
        });

        if (hasNoCollisions) availableRooms.push([building, room]);
      }
    }

    return availableRooms;
  };

  /**
   * Returns the start and end timestamps of a given room's availability on a
   * date at a time.
   *
   * @param building - the building name
   * @param room - the room code
   * @param timestamp - the timestamp to check.
   *
   * @throws {Error} if the room is not found
   * @throws {Error} if the room is not available at the given time
   *
   * TODO: could use some dirty memoization to compare input timestamp
   * with last known timestamp ranges
   */
  const getRoomDuration = (
    building: string,
    room: string,
    timestamp: number
  ): [number, number] => {
    let sections = Object.values(data[building][room]);
    if (!sections) {
      throw new Error(`Room ${building} ${room} not found`);
    }

    const day = new Date(timestamp).getDay();

    // filter out invalid sections, then sort (assume no two classes overlap)
    sections = sections
      .filter((section) => section.weekDays.includes(day))
      .toSorted((a, b) => getRelTime(a.startTime) - getRelTime(b.startTime));

    // break if class is free for day
    if (sections.length === 0) {
      return [getRelTime("00:00:00"), getRelTime("23:59:59")];
    }

    // break if timestamp before first class
    if (timestamp < getRelTime(sections[0].startTime)) {
      return [getRelTime("00:00:00"), getRelTime(sections[0].startTime)];
    }

    for (let i = 0; i < sections.length; i++) {
      const emptyStart = getRelTime(sections[i].endTime);

      if (timestamp > emptyStart) {
        // break if timestamp is after last class ends
        if (i === sections.length - 1) {
          return [emptyStart, getRelTime("23:35:59")];
        }

        // otherwise, return period between two classes
        return [emptyStart, getRelTime(sections[i + 1].startTime)];
      }
    }

    // if we reach here, no valid time; throw an error! something must've gone wrong lol
    throw Error(`no time for room ${building} ${room}`);
  };

  /**
   * Returns an array of start/end timestamp tuples, each of which represents
   * a period that the given room is *not* available on the timestamp
   *
   * @param building building name
   * @param room room number
   * @param timestamp day to check against
   *
   * @throws {Error} if the room is not found
   */
  const getOccupiedTimes = (
    building: string,
    room: string,
    timestamp: number
  ): [number, number][] => {
    let sections = Object.values(data[building][room]);
    if (!sections) {
      throw new Error(`Room ${building} ${room} not found`);
    }

    const day = new Date(timestamp).getDay();

    // filter out invalid sections, then sort (assume no two classes overlap)
    sections = sections
      .filter((section) => section.weekDays.includes(day))
      .toSorted((a, b) => getRelTime(a.startTime) - getRelTime(b.startTime));

    // room is free for full day
    if (sections.length === 0) {
      return [];
    }

    return sections.map((section) => [
      getRelTime(section.startTime),
      getRelTime(section.endTime),
    ]);
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

{#if occupiedKey}
  {@const occupiedTimes = getOccupiedTimes(
    occupiedKey[0],
    occupiedKey[1],
    date.getTime()
  )}
  {#key occupiedKey}
    {#each occupiedTimes as occupiedTime}
      <p>from {occupiedTime[0]} to {occupiedTime[1]}</p>
    {/each}
  {/key}
{/if}

<div class="outer">
  <!-- all courses -->
  <main class="grid">
    {#each Object.entries(data) as [building, rooms]}
      <p>{building}</p>
      <div class="grid">
        {#each Object.entries(rooms) as [room, sections]}
          <div class="grid-leaf">
            <p>{room}</p>
            <button on:click={(e) => (occupiedKey = [building, room])}>
              occupied times
            </button>
          </div>
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
        {#each getAvailableRooms(date.getTime()) as [building, room]}
          {@const [startEmpty, endEmpty] = getRoomDuration(
            building,
            room,
            date.getTime()
          )}
          <li>
            {building}
            {room} ({new Date(startEmpty).toLocaleTimeString()} - {new Date(
              endEmpty
            ).toLocaleTimeString()})
          </li>
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

  .grid-leaf {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
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
