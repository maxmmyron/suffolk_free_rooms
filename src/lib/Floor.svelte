<script lang="ts">
  import { currentFloor } from "$lib/stores";
  import { forwardEventHandlers, T, type AsyncWritable } from "@threlte/core";
  import {
    createTransition,
    useCursor,
    type ThrelteGltf,
  } from "@threlte/extras";
  import { Mesh, MeshLambertMaterial, MeshPhysicalMaterial } from "three";
  import { cubicOut } from "svelte/easing";

  export let offset: number;
  export let store: AsyncWritable<
    ThrelteGltf<{
      nodes: Record<string, any>;
      materials: Record<string, any>;
    }>
  >;

  export let floor: string | null = null;
  export let hasFreeRooms: boolean = false;

  /**
   * Building height. used for transitioning camera
   * TODO: lazy
   */
  export let transitionHeight: number = 400;

  $: color = hasFreeRooms ? "#ddffdd" : "#666666";

  const component = forwardEventHandlers();

  // TODO: smoother transitions (not just cubic out/in, maybe spring?)
  const fly = createTransition<Mesh>((ref, { direction }) => {
    return {
      tick: (t) => {
        if (direction === "in") {
          ref.position.set(
            ref.position.x,
            offset + (1 - t) * -transitionHeight,
            ref.position.z
          );
        }
        if (direction === "out") {
          ref.position.set(
            ref.position.x,
            offset + (1 - t) * transitionHeight,
            ref.position.z
          );
        }
      },
      duration: 1600,
      easing: cubicOut,
    };
  });

  const { onPointerEnter, onPointerLeave } = useCursor();

  console.log(`floor ${floor} ${offset}`);
</script>

{#if $store}
  <T.Group {...$$restProps} bind:this={$component}>
    <T.Mesh
      castShadow
      receiveShadow
      in={fly}
      out={fly}
      position.y={offset}
      geometry={$store.nodes["Floor"].geometry}
      on:pointerenter={onPointerEnter}
      on:pointerleave={onPointerLeave}
      on:pointerenter={(e) => {
        e.stopPropagation();
        if (hasFreeRooms) color = "#aaffaa";
      }}
      on:pointerleave={(e) => {
        e.stopPropagation();
        if (hasFreeRooms) color = "#ddffdd";
      }}
      on:click={(e) => {
        e.stopPropagation();
        $currentFloor = floor;
      }}
      material={new MeshPhysicalMaterial({
        metalness: 0.0,
        roughness: 0.5,
        reflectivity: 0.8,
        color,
      })}
    />
  </T.Group>
{/if}
