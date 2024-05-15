<script lang="ts">
  import Building from "$lib/Building.svelte";
  import Scene from "$lib/Scene.svelte";
  import { Canvas, type ThrelteContext } from "@threlte/core";

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

  let building: string = "Sawyer";
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
      <select bind:value={building}>
        <option value="Sawyer">Sawyer</option>
        <option value="Rosalie K. Stahl Bldg">Rosalie K. Stahl Bldg</option>
        <option value="Samia Academic Center">Samia Academic Center</option>
        <option value="Sargent Hall">Sargent Hall</option>
        <option value="1 Beacon">1 Beacon</option>
      </select>
    </label>
  </aside>

  <div bind:clientWidth={canvasWidth} bind:clientHeight={canvasHeight}>
    <Canvas size={{ width: canvasWidth, height: canvasHeight }}>
      <Scene bind:building bind:availableRooms />
    </Canvas>
  </div>
</main>

<!-- <div class="buildings">
  {#each Object.entries(data) as [building, rooms]}
    {@const availableBuildingRooms = availableRooms.filter(
      (p) => p[0] === building
    )}
    {@const floors = floorMap.get(building)}
    {#if floors}
      <div class="building">
        <h1>{building}</h1>
        {#each floors.toReversed() as floor, i}
          {@const availableFloorRooms = getAvailableFloorRooms(
            building,
            availableBuildingRooms,
            floor
          )}
          <div
            class="floor"
            style="z-index: {floors.length * 2 - i * 2};"
            data-has-rooms={availableFloorRooms.length !== 0}
          >
            <div class="face horz front">{floor}</div>
            <div class="face horz back"></div>
            <div class="face horz left"></div>
            <div class="face horz right"></div>
            <div class="face bottom"></div>
          </div>
          {#if availableFloorRooms.length}
            <ul style="z-index: {floors.length * 2 - i};">
              {#each availableFloorRooms as [building, room]}
                {@const [startFree, endFree] = calcEmptyRoomTimes(
                  building,
                  room,
                  time
                )}
                {@const startFreeTime = new Date(
                  startFree
                ).toLocaleTimeString()}
                {@const endFreeTime = new Date(endFree).toLocaleTimeString()}
                <li>
                  {building}
                  {room} <br />
                  {startFreeTime} - {endFreeTime}
                </li>
              {/each}
            </ul>
          {/if}
        {/each}
      </div>
    {/if}
  {/each}
</div> -->

<style>
  main {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: grid;
    grid-template-columns: 600px 1fr;
  }

  .buildings {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .building {
    display: grid;
    grid-template-columns: 200px 300px;
    justify-items: center;
    align-items: flex-end;
    flex-shrink: 0;
    padding-bottom: 2rem;
    border-bottom: 1px solid black;
    margin-bottom: 2rem;
    perspective: none;

    & > h1 {
      grid-area: 1/1/1/3;
    }

    & > .floor {
      grid-column: 1;
      position: relative;
      width: 120px;
      height: 32px;
      margin-bottom: -2px;
      transform-style: preserve-3d;
      transform: rotateY(46deg) rotateX(-12deg) rotateZ(-12deg);

      &[data-had-rooms="true"] {
        border-bottom: 1px dashed rgb(128, 128, 128);
      }

      & + ul {
        position: relative;
      }

      /* target ul sibling */
      &[data-has-rooms="true"] + ul::after {
        --width: 120px;
        --height: 16px;
        content: "";
        width: var(--width);
        height: var(--height);
        position: absolute;
        bottom: 12px;
        left: calc(20px - var(--width));
        pointer-events: none;
        border-radius: 8px 0 0 0;
        border: 2px dashed rgb(40, 40, 40);
        border-width: 2px 0 0 2px;
      }

      & > .face {
        display: block;
        position: absolute;
        backface-visibility: visible;
        outline: 1px solid transparent;
      }

      & > .horz {
        width: 120px;
        height: 100%;
      }

      & > .front {
        background-color: rgb(128, 128, 128);
        transform: translateZ(60px);
        border-bottom: 1.5px solid rgba(0, 0, 0, 0.2);
      }

      & > .back {
        background-color: rgb(100, 100, 100);
        transform: rotateY(180deg) translateZ(60px);
      }

      & > .left {
        background-color: rgb(200, 200, 200);
        transform: rotateY(-90deg) translateZ(60px);
        border-bottom: 1.5px solid rgba(0, 0, 0, 0.2);
      }

      & > .right {
        background-color: rgb(80, 80, 80);
        transform: rotateY(90deg) translateZ(60px);
      }

      & > .bottom {
        width: 118px;
        height: 118px;
        background-color: rgb(40, 40, 40);
        transform: rotateX(-90deg) translateZ(-30px) translateX(1px);
      }
    }
  }
</style>
