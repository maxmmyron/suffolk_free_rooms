<script lang="ts">
  import { getAvailableFloorRooms } from "$lib";
  import { T } from "@threlte/core";
  import { useGltf } from "@threlte/extras";
  import { Color, MeshStandardMaterial } from "three";
  import Floor from "./Floor.svelte";

  /**
   * Full building name
   */
  export let building: App.Building;

  /**
   * path to gltf model
   */
  export let modelData: {
    lobby?: [string, number];
    default: [string, number];
    roof?: [string, number?];
  };

  /**
   * array of floor names, from bottom floor -> top
   */
  export let floors: string[];

  /**
   * array of building/room pairs
   */
  export let rooms: [string, string][];

  /**
   * X offset of model
   */
  // export let offset = 0;

  // const lobbyGltf = useGltf(modelData.lobby![0]);
  // const defaultGltf = useGltf(modelData.default[0]);
  // const roofGltf = useGltf(modelData.roof![0]);

  let floorHeight = modelData.lobby
    ? modelData.lobby[1] + modelData.default[1] * (floors.length - 1)
    : modelData.default[1] * floors.length;

  export const height =
    floorHeight + (modelData.roof ? modelData.roof[1] ?? 0 : 0);

  const defaultGltf = useGltf(modelData.default[0]);
  const lobbyGltf = modelData.lobby ? useGltf(modelData.lobby[0]) : null;
  const roofGltf = modelData.roof ? useGltf(modelData.roof[0]) : null;
</script>

{#if $defaultGltf}
  {#each floors as floor, i}
    <!-- need to check if on ground floor *and* lobbyGltf exists *and* lobbyGltf store is loaded! -->
    {#if i === 0 && lobbyGltf && $lobbyGltf}
      <Floor offset={0} geometry={$lobbyGltf.nodes["Floor"].geometry} />
    {:else}
      {@const offset = modelData.lobby
        ? modelData.lobby[1]
        : modelData.default[1] + modelData.default[1] * (i - 1)}
      <Floor
        {offset}
        geometry={$defaultGltf.nodes["Floor"].geometry}
        hasFreeRooms={getAvailableFloorRooms(building, rooms, floor).length !==
          0}
        {floor}
      />
    {/if}
  {/each}
  {#if roofGltf && $roofGltf}
    <Floor offset={floorHeight} geometry={$roofGltf.nodes["Floor"].geometry} />
  {/if}
{/if}
