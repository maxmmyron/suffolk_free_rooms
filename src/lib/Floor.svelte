<script lang="ts">
  import { forwardEventHandlers, T } from "@threlte/core";
  import { useCursor } from "@threlte/extras";
  import { MeshStandardMaterial } from "three";

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
    on:pointerenter={() => {
      if (hasFreeRooms) color = "blue";
    }}
    on:pointerleave={() => {
      if (hasFreeRooms) color = "red";
    }}
    material={new MeshStandardMaterial({
      roughness: 1,
      color,
    })}
  />
</T.Group>
