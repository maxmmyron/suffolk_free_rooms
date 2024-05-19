<script lang="ts">
  import { currentBuilding, cameraAnimator } from "$lib/stores";
  import { T } from "@threlte/core";
  import { interactivity, transitions, Environment } from "@threlte/extras";
  import Building from "./Building.svelte";
  import { SheetObject } from "@threlte/theatre";
  import CameraAnimator from "./CameraAnimator.svelte";
  import {
    Mesh,
    MeshStandardMaterial,
    PlaneGeometry,
    Sphere,
    Vector3,
  } from "three";

  export let availableRooms: [string, string][];

  // bind height so we can refit camera
  let height: number;

  interactivity();
  transitions();

  $: ((_: App.Building) => {
    if (!$cameraAnimator) {
      console.log("Camera animator not found");
      return;
    }

    let sphere = new Sphere(
      new Vector3(0, Math.max(15, height / 6), 0),
      Math.min(height, 120)
    );
    $cameraAnimator.fitToSphere(sphere, true);
  })($currentBuilding);
</script>

<Environment
  path="/envmap/"
  files="urban_4k.hdr"
  isBackground={true}
  format="hdr"
/>

<T.AmbientLight intensity={0.5} />
<T.DirectionalLight position={[0, 1, 1]} castShadow />
<!-- <T.DirectionalLight position={[-10, 10, 10]} castShadow /> -->

<T.PerspectiveCamera
  makeDefault
  position={[15, 5, -15]}
  on:create={({ ref }) => {
    ref.lookAt(0, 5, 0);
  }}
>
  <CameraAnimator
    on:create={({ ref }) => {
      $cameraAnimator = ref;
    }}
    autoRotate={false}
    enabled={true}
  />
</T.PerspectiveCamera>

<T.Mesh
  geometry={new PlaneGeometry(500, 500)}
  material={new MeshStandardMaterial({
    color: "white",
  })}
  receiveShadow
  rotation.x={-Math.PI / 2}
/>

{#key $currentBuilding}
  <Building
    building={$currentBuilding}
    rooms={availableRooms.filter((p) => p[0] === $currentBuilding)}
    bind:height
  />
{/key}
