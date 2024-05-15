// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		type SectionData = {
    [building: string]: {
      [room: string]: {
        [section: string]: {
          startTime: string;
          endTime: string;
          weekDays: number[];
        };
      };
    };
  }
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
