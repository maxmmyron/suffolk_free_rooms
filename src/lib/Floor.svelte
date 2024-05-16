<script lang="ts">
  import { currentFloor } from "$lib/stores";
  import { forwardEventHandlers, T } from "@threlte/core";
  import { useCursor } from "@threlte/extras";
  import { MeshStandardMaterial } from "three";

  export let floor: string;
  export let hasFreeRooms: boolean;
  export let geometry;
  export let offset: number;

  let color = hasFreeRooms ? "red" : "white";

  const component = forwardEventHandlers();

  const { onPointerEnter, onPointerLeave } = useCursor();
</script>

<T.Group {...$$restProps} bind:this={$component}>
  <T.Mesh
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
