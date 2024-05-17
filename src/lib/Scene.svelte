<script lang="ts">
  import { currentBuilding, cameraAnimator } from "$lib/stores";
  import { floorMap } from "$lib";
  import { T } from "@threlte/core";
  import {
    OrbitControls,
    Sky,
    interactivity,
    transitions,
  } from "@threlte/extras";
  import Building from "./Building.svelte";
  import { SheetObject } from "@threlte/theatre";
  import CameraAnimator from "./CameraAnimator.svelte";
  import {
    Sphere,
    Vector3,
    type OrthographicCamera,
    type PerspectiveCamera,
  } from "three";

  export let availableRooms: [string, string][];

  $: data = floorMap.get($currentBuilding)!;

  let camera: PerspectiveCamera | OrthographicCamera;

  // bind height so we can refit camera
  let height: number;

  $: if ($cameraAnimator) {
    // @ts-ignore
    camera = $cameraAnimator._camera;
  }

  interactivity();
  transitions();

  $: ((building: App.Building) => {
    if (!$cameraAnimator) {
      console.log("Camera animator not found");
      return;
    }

    if (building === "Rosalie K. Stahl Bldg") {
      let sphere = new Sphere(new Vector3(0, height / 2, 0), height / 2);
      $cameraAnimator.fitToSphere(sphere, true);
      return;
    }

    let sphere = new Sphere(
      new Vector3(0, data.floors.length / 2, 0),
      Math.max(data.floors.length * 0.7, 6)
    );

    $cameraAnimator.fitToSphere(sphere, true);
  })($currentBuilding);
</script>

<T.AmbientLight intensity={0.5} />
<T.DirectionalLight position={[0, 10, 10]} castShadow />

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
      <!-- <OrbitControls /> -->
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
      modelData={data.modelData}
      bind:height
    />
  {/if}
{/key}
