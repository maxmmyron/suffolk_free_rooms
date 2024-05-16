<script lang="ts">
  import { currentBuilding } from "$lib/stores";
  import { floorMap, getAvailableFloorRooms } from "$lib";
  import { T } from "@threlte/core";
  import { OrbitControls, Sky, interactivity } from "@threlte/extras";
  import Building from "./Building.svelte";
  import { SheetObject } from "@threlte/theatre";

  export let availableRooms: [string, string][];

  $: data = floorMap.get($currentBuilding)!;

  interactivity();
</script>

<Sky elevation={0.5} />

{#key $currentBuilding}
  {#if $currentBuilding && data}
    <SheetObject key="camera" let:Transform>
      <Transform>
        <T.PerspectiveCamera
          makeDefault
          position={[20, data.floors.length * 2, -20]}
          lookAt.y={0}
        >
          <OrbitControls enableDamping />
        </T.PerspectiveCamera>
      </Transform>
    </SheetObject>
    {@const buildingRooms = availableRooms.filter(
      (p) => p[0] === $currentBuilding
    )}
    <SheetObject key="building">
      <Building
        building={$currentBuilding}
        floors={data.floors}
        rooms={buildingRooms}
        path={data.gltfPath}
      />
    </SheetObject>
  {/if}
{/key}
