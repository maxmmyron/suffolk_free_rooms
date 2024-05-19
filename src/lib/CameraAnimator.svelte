<!-- see https://threlte.xyz/docs/examples/camera/camera-controls -->

<script context="module" lang="ts">
  let installed = false;
</script>

<script lang="ts">
  import {
    T,
    forwardEventHandlers,
    useParent,
    useTask,
    useThrelte,
  } from "@threlte/core";
  import CameraControls from "camera-controls";

  import type {
    CameraAnimatorEvents,
    CameraAnimatorProps,
    CameraAnimatorSlots,
  } from "./CameraAnimator.svelte";
  import {
    Box3,
    Matrix4,
    Quaternion,
    Raycaster,
    Sphere,
    Spherical,
    Vector2,
    Vector3,
    Vector4,
    type PerspectiveCamera,
  } from "three";
  import { DEG2RAD } from "three/src/math/MathUtils.js";

  type $$Props = CameraAnimatorProps;
  type $$Events = CameraAnimatorEvents;
  type $$Slots = CameraAnimatorSlots;

  const subsetOfTHREE = {
    Vector2,
    Vector3,
    Vector4,
    Quaternion,
    Matrix4,
    Spherical,
    Box3,
    Sphere,
    Raycaster,
  };

  if (!installed) {
    CameraControls.install({ THREE: subsetOfTHREE });
    installed = true;
  }

  const parent = useParent();

  if (!$parent) {
    throw new Error("CameraAnimator must be a child of a Camera");
  }

  const { renderer, invalidate } = useThrelte();

  // TODO: implement
  export let autoRotate = true;
  export let rotateSpeed = 1;
  export let enabled = false;

  export const ref = new CameraControls(
    $parent as PerspectiveCamera,
    renderer?.domElement
  );

  const getControls = () => ref;

  let disableAutoRotate = false;

  useTask(
    (delta) => {
      if (autoRotate && !disableAutoRotate) {
        getControls().azimuthAngle += 4 * delta * DEG2RAD * rotateSpeed;
      }
      const updated = getControls().update(delta);
      if (updated) {
        invalidate();
      }
    },
    {
      autoInvalidate: false,
    }
  );

  const forwardingComponent = forwardEventHandlers();
</script>

<T is={ref} {...$$restProps} bind:this={$forwardingComponent} {enabled}>
  <slot {ref} />
</T>
