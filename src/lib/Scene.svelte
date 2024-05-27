<script lang="ts">
  import { currentBuilding, cameraAnimator } from "$lib/stores";
  import { T, useThrelte } from "@threlte/core";
  import { Environment, interactivity, transitions } from "@threlte/extras";
  import Building from "./Building.svelte";
  import CameraAnimator from "./CameraAnimator.svelte";
  import {
    CameraHelper,
    DirectionalLight,
    DirectionalLightHelper,
    Sphere,
    Vector3,
  } from "three";
  import { onMount } from "svelte";
  import { DEG2RAD } from "three/src/math/MathUtils.js";

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

  let light: DirectionalLight;

  const { scene, camera, invalidate } = useThrelte();

  onMount(() => {
    scene.add(new DirectionalLightHelper(light, 5));
  });

  // invalidate();
  // scene.add(new CameraHelper($camera));
</script>

<Environment
  path="/envmap/"
  files="urban_4k.hdr"
  isBackground={true}
  format="hdr"
/>

<T.DirectionalLight
  bind:ref={light}
  position={[40, 50, 40]}
  castShadow={true}
  shadow.mapSize.width={1024}
  shadow.mapSize.height={1024}
  shadow.camera.near={0.1}
  shadow.camera.far={500}
  shadow.camera.left={-50}
  shadow.camera.right={50}
  shadow.camera.top={50}
  shadow.camera.bottom={-50}
/>

<T.PerspectiveCamera
  makeDefault
  position={[15, 5, -15]}
  on:create={({ ref }) => {
    ref.lookAt(0, 5, 0);
  }}
  let:ref={camera}
  far={10000}
>
  <CameraAnimator
    on:create={({ ref }) => {
      $cameraAnimator = ref;
    }}
    autoRotate={false}
    enabled={true}
  />
</T.PerspectiveCamera>

{#key $currentBuilding}
  <Building
    building={$currentBuilding}
    rooms={availableRooms.filter((p) => p[0] === $currentBuilding)}
    bind:height
  />
{/key}

<T.Mesh rotation.x={-90 * DEG2RAD} receiveShadow>
  <T.PlaneGeometry args={[1000, 1000]} />
  <T.MeshStandardMaterial color="#00ff00" />
</T.Mesh>
