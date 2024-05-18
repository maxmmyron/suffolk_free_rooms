<script lang="ts">
  import { floorMap, getAvailableFloorRooms } from "$lib";
  import type { AsyncWritable } from "@threlte/core";
  import { useGltf, type ThrelteGltf } from "@threlte/extras";
  import Floor from "./Floor.svelte";

  /**
   * Full building name
   */
  export let building: App.Building;

  /**
   * array of building/room pairs
   */
  export let rooms: [string, string][];

  const { floors, modelData, modelMap } = floorMap.get(building)!;

  let modelStores = new Map<
    string,
    AsyncWritable<
      ThrelteGltf<{
        nodes: Record<string, any>;
        materials: Record<string, any>;
      }>
    >
  >();

  for (const [key, value] of Object.entries(modelData)) {
    if (value) modelStores.set(key, useGltf(value[0]));
  }

  /**
   * Gets the height of the building up to the ith floor
   * @param floors array of floor names, so we can index for special models
   * @param i floor index to stop at. Defaults to -1, which returns the total height
   */
  const getFloorHeight = (floors: string[], i: number = -1): number => {
    let sum = 0;
    for (let j = 0; j < floors.length; j++) {
      if (j === i) return sum;

      if (modelMap && modelMap[floors[j]]) {
        sum += modelData[modelMap[floors[j]]]![1];
      } else {
        sum += modelData.default[1];
      }
    }

    return sum;
  };

  // WARNING: this is a hack to get around the lack of typescript syntax in svelte html (thank god for svelte 5)
  const getModel_HACK = (model: string) => {
    return modelStores.get(model)!;
  };

  export const height =
    getFloorHeight(floors) + (modelData.roof ? modelData.roof[1] : 0);

  $: console.log(floors);
</script>

{#each floors as floor, i}
  {@const offset = getFloorHeight(floors, i)}
  {@const hasFreeRooms =
    getAvailableFloorRooms(building, rooms, floor).length !== 0}
  {#if modelMap && modelMap[floor] && modelStores.get(modelMap[floor])}
    <Floor
      {offset}
      store={getModel_HACK(modelMap[floor])}
      {hasFreeRooms}
      {floor}
    />
  {:else}
    <Floor {offset} store={getModel_HACK("default")} {hasFreeRooms} {floor} />
  {/if}
{/each}

{#if modelStores.has("roof")}
  <Floor offset={getFloorHeight(floors)} store={getModel_HACK("roof")} />
{/if}
