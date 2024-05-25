<script lang="ts">
  import { currentBuilding, currentFloor } from "$lib/stores";
  import Scene from "$lib/Scene.svelte";
  import { Canvas } from "@threlte/core";
  import { floorMap, getAvailableFloorRooms } from "$lib";

  export let data: App.SectionData;

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

  let canvasWidth: number;
  let canvasHeight: number;
</script>

<main>
  <aside>
    <label>
      <input
        type="datetime-local"
        on:input={(e) => {
          date = new Date(e.currentTarget.value);
        }}
      />
      <output>{date.toString()}</output>
    </label>

    <label>
      <select
        bind:value={$currentBuilding}
        on:change={() => {
          $currentFloor = null;
        }}
      >
        <option value="Sawyer">Sawyer</option>
        <option value="Rosalie K. Stahl Bldg">Rosalie K. Stahl Bldg</option>
        <option value="Samia Academic Center">Samia Academic Center</option>
        <option value="Sargent Hall">Sargent Hall</option>
        <option value="1 Beacon">1 Beacon</option>
      </select>
    </label>

    {#if $currentFloor && floorMap
        .get($currentBuilding)
        ?.floors.includes($currentFloor)}
      {@const availableBuildingRooms = availableRooms.filter(
        (p) => p[0] === $currentBuilding
      )}

      {@const availableFloorRooms = getAvailableFloorRooms(
        $currentBuilding,
        availableBuildingRooms,
        $currentFloor
      )}

      <ul>
        {#each availableFloorRooms as [building, room]}
          {@const [startFree, endFree] = calcEmptyRoomTimes(
            building,
            room,
            time
          )}
          {@const startFreeTime = new Date(startFree).toLocaleTimeString()}
          {@const endFreeTime = new Date(endFree).toLocaleTimeString()}
          <li>
            {building}
            {room} <br />
            {startFreeTime} - {endFreeTime}
          </li>
        {/each}
      </ul>
    {/if}
  </aside>

  <div bind:clientWidth={canvasWidth} bind:clientHeight={canvasHeight}>
    <Canvas size={{ width: canvasWidth, height: canvasHeight }}>
      <Scene bind:availableRooms />
    </Canvas>
  </div>
</main>

<style>
  main {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: grid;
    grid-template-columns: 200px 1fr;
  }
</style>
