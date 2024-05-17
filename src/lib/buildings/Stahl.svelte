<script lang="ts">
  import { floorMap, getAvailableFloorRooms } from "$lib";
  import { T } from "@threlte/core";
  import { useGltf } from "@threlte/extras";
  import { Color, MeshStandardMaterial } from "three";
  import Floor from "../Floor.svelte";

  /**
   * array of building/room pairs
   */
  export let rooms: [string, string][];

  const { floors } = floorMap.get("Rosalie K. Stahl Bldg")!;

  const lobby = useGltf("/stahl/lobby.gltf");
  const generic = useGltf("/stahl/floor.gltf");
  const roof = useGltf("/stahl/roof.gltf");

  const lobbyHeight = 5;
  const genericHeight = 4.02968;

  export const height = lobbyHeight + genericHeight * (floors.length - 1);
</script>

{#if $lobby && $generic && $roof}
  {#each floors as floor, i}
    {@const geometry =
      i === 0
        ? $lobby.nodes["Floor"].geometry
        : $generic.nodes["Floor"].geometry}
    {@const offset = i === 0 ? 0 : (i - 1) * genericHeight + lobbyHeight}
    <Floor
      {offset}
      {geometry}
      hasFreeRooms={getAvailableFloorRooms(
        "Rosalie K. Stahl Bldg",
        rooms,
        floor
      ).length !== 0}
      {floor}
    />
  {/each}
  <Floor offset={height} geometry={$roof.nodes["Floor"].geometry} />
{/if}
