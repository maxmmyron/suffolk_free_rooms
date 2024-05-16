import { writable, type Writable } from "svelte/store";

export const currentBuilding: Writable<App.Building> = writable();
export const currentFloor: Writable<string | null> = writable();
