<script lang="ts">
  import { getAvailableFloorRooms } from "$lib";
  import { T } from "@threlte/core";
  import { useGltf } from "@threlte/extras";
  import { Color, MeshStandardMaterial } from "three";
  import Floor from "./Floor.svelte";

  /**
   * Full building name
   */
  export let building: string;

  /**
   * path to gltf model
   */
  export let path: string;

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

  const gltf = useGltf(path);
</script>

{#if $gltf}
  {#each floors.toReversed() as floor, i}
    <Floor
      offset={i}
      geometry={$gltf.nodes["Floor"].geometry}
      hasFreeRooms={getAvailableFloorRooms(building, rooms, floor).length !== 0}
    />
  {/each}
{/if}
