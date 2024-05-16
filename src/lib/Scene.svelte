<script lang="ts">
  import { currentBuilding } from "$lib/stores";
  import { floorMap } from "$lib";
  import { T } from "@threlte/core";
  import { Sky, interactivity, transitions } from "@threlte/extras";
  import Building from "./Building.svelte";
  import { SheetObject } from "@threlte/theatre";

  export let availableRooms: [string, string][];

  $: data = floorMap.get($currentBuilding)!;

  interactivity();
  transitions();

  /**
   * TODO: add smooth transition between prev and next cam pos
   * position={[
            10 + data.floors.length * 0.5,
            camHeight,
            -10 - data.floors.length * 0.5,
          ]}

          on:create={({ ref }) => {
            ref.lookAt(0, data.floors.length / 2, 0);
          }}
  */
</script>

<Sky elevation={0.5} />

<SheetObject key="camera" let:Transform>
  <Transform>
    <T.PerspectiveCamera
      makeDefault
      position={[15, 10, -15]}
      on:create={({ ref }) => {
        ref.lookAt(0, 5, 0);
      }}
    />
  </Transform>
</SheetObject>

{#key $currentBuilding}
  {#if data}
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
