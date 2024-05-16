<script lang="ts">
  import { currentBuilding, cameraAnimator } from "$lib/stores";
  import { floorMap } from "$lib";
  import { T } from "@threlte/core";
  import { Sky, interactivity, transitions } from "@threlte/extras";
  import Building from "./Building.svelte";
  import { SheetObject } from "@threlte/theatre";
  import CameraAnimator from "./CameraAnimator.svelte";
  import type { OrthographicCamera, PerspectiveCamera } from "three";
  import { DEG2RAD } from "three/src/math/MathUtils.js";

  export let availableRooms: [string, string][];

  $: data = floorMap.get($currentBuilding)!;

  let camera: PerspectiveCamera | OrthographicCamera;

  $: if ($cameraAnimator) {
    // @ts-ignore
    camera = $cameraAnimator._camera;
  }

  interactivity();
  transitions();

  $: ((building: App.Building) => {
    if (!$cameraAnimator) return;

    switch (building) {
      // TODO: finish me
      case "Sawyer":
        $cameraAnimator.rotate(-90 * DEG2RAD, 0, true);
        break;
      case "Rosalie K. Stahl Bldg":
        $cameraAnimator.rotate(90 * DEG2RAD, 0, true);
        break;
      case "Samia Academic Center":
        $cameraAnimator.rotate(-180 * DEG2RAD, 0, true);
        break;
      case "Sargent Hall":
        $cameraAnimator.rotate(180 * DEG2RAD, 0, true);
        break;
      case "1 Beacon":
        $cameraAnimator.rotate(270 * DEG2RAD, 0, true);
        break;
    }
  })($currentBuilding);

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
    >
      <CameraAnimator
        on:create={({ ref }) => {
          $cameraAnimator = ref;
        }}
      />
    </T.PerspectiveCamera>
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
