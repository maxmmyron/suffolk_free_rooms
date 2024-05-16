<script lang="ts">
  import { currentFloor } from "$lib/stores";
  import { forwardEventHandlers, T } from "@threlte/core";
  import { createTransition, useCursor } from "@threlte/extras";
  import { Group, Mesh, MeshStandardMaterial } from "three";
  import { cubicOut } from "svelte/easing";

  export let floor: string;
  export let hasFreeRooms: boolean;
  export let geometry;
  export let offset: number;

  let color = hasFreeRooms ? "red" : "white";

  const component = forwardEventHandlers();

  const fly = createTransition<Mesh>((ref, { direction }) => {
    return {
      tick: (t) => {
        if (direction === "in") {
          ref.position.set(
            ref.position.x,
            offset + (1 - t) * -20,
            ref.position.z
          );
        }
        if (direction === "out") {
          ref.position.set(
            ref.position.x,
            offset + (1 - t) * 20,
            ref.position.z
          );
        }
      },
      duration: 1000,
      easing: cubicOut,
    };
  });

  const { onPointerEnter, onPointerLeave } = useCursor();
</script>

<T.Group {...$$restProps} bind:this={$component}>
  <T.Mesh
    in={fly}
    out={fly}
    position.y={offset}
    {geometry}
    on:pointerenter={onPointerEnter}
    on:pointerleave={onPointerLeave}
    on:pointerenter={(e) => {
      e.stopPropagation();
      if (hasFreeRooms) color = "blue";
    }}
    on:pointerleave={(e) => {
      e.stopPropagation();
      if (hasFreeRooms) color = "red";
    }}
    on:click={(e) => {
      e.stopPropagation();
      $currentFloor = floor;
    }}
    material={new MeshStandardMaterial({
      roughness: 1,
      color,
    })}
  />
</T.Group>
