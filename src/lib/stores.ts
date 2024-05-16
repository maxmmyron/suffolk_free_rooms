import type CameraControls from "camera-controls";
import { writable, type Writable } from "svelte/store";

export const currentBuilding: Writable<App.Building> = writable();
export const currentFloor: Writable<string | null> = writable();

export const cameraAnimator: Writable<CameraControls | undefined> = writable(undefined);

