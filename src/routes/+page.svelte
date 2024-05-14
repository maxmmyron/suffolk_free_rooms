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
  $: time = date.getTime();

  let occupiedKey: [string, string];

  $: availableRooms = getAvailableRooms(time);

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
        const hasCollision = Object.values(sections).some(
          ({ startTime, endTime }) =>
            timestamp >= getRelTime(startTime) &&
            timestamp <= getRelTime(endTime)
        );

        if (!hasCollision) availableRooms.push([building, room]);
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
  const calcEmptyRoomTimes = (
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

    for (let i = sections.length - 1; i >= 0; i--) {
      const emptyStart = getRelTime(sections[i].endTime);

      if (timestamp > emptyStart) {
        // break if timestamp is after last class ends
        if (i === sections.length - 1) {
          return [emptyStart, getRelTime("23:59:59")];
        }
        // otherwise, return period between two classes
        else return [emptyStart, getRelTime(sections[i + 1].startTime)];
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
  const calcOccupiedTimes = (
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

{#each Object.entries(data) as [building, rooms]}
  {#each Object.entries(rooms) as [room, _]}
    {#if availableRooms.findIndex((s) => s[0] === building && s[1] === room) !== -1}
      {@const filledTimes = calcOccupiedTimes(building, room, time)}
      {@const [startFree, endFree] = calcEmptyRoomTimes(building, room, time)}
      <article class="room">
        <h2>{building} {room}</h2>
        <div>
          {#each { length: 24 } as _, i}
            <div class="tick" data-time="{i}:00"></div>
          {/each}
          {#each filledTimes as [startFilled, endFilled]}
            {@const start =
              (startFilled - getRelTime("00:00:00")) / 3600000 / 24}
            {@const end = (endFilled - getRelTime("00:00:00")) / 3600000 / 24}
            <div
              style="left: {start * 100}%; right: {(1 - end) * 100}%;"
              class="course-time"
            ></div>
          {/each}
        </div>
      </article>
    {/if}
  {/each}
{/each}

<style>
  article.room {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.25);
    margin: 1rem 0;
    padding-bottom: 0.5rem;
    & h2 {
      font-size: 1.25rem;
      margin: 0;
    }

    & > div {
      display: grid;
      grid-template-columns: repeat(24, 1fr);
      height: 4rem;
      position: relative;

      background-color: rgba(240, 240, 240, 1);
      border-radius: 12px;

      & .tick {
        position: relative;
        border-left: 1px solid rgba(0, 0, 0, 0.25);
        &::after {
          position: absolute;
          content: attr(data-time);
          font-size: 0.7rem;
          color: rgba(60, 60, 60, 1);
          bottom: 0px;
        }
      }

      & .course-time {
        position: absolute;
        height: 50%;
        background-color: blue;
      }
    }
  }
</style>
