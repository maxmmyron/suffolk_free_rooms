<script lang="ts">
  import { currentBuilding } from "$lib/stores";
  import { floorMap, getAvailableFloorRooms } from "$lib";
  import { T } from "@threlte/core";
  import { OrbitControls, Sky, interactivity } from "@threlte/extras";
  import Building from "./Building.svelte";

  export let availableRooms: [string, string][];

  $: data = floorMap.get($currentBuilding)!;

  interactivity();
</script>

<Sky elevation={0.5} />

{#key $currentBuilding}
  {#if $currentBuilding && data}
    <T.PerspectiveCamera
      makeDefault
      position={[20, data.floors.length * 2, -20]}
      lookAt.y={data.floors.length}
    >
      <OrbitControls enableDamping />
    </T.PerspectiveCamera>
    {@const buildingRooms = availableRooms.filter(
      (p) => p[0] === $currentBuilding
    )}
    <Building
      building={$currentBuilding}
      floors={data.floors}
      rooms={buildingRooms}
      path={data.gltfPath}
    />
  {/if}
{/key}
