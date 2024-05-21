/**
 * Gets the floor a room is on based on the building
 * @param building
 * @param rooms
 */
export const getAvailableFloorRooms = (
  building: App.Building,
  rooms: [string, string][],
  floor: string
): [string, string][] => {
  switch (building) {
    case "Sawyer":
      // EITHER XYY or XXYY, so trim away YY to get X/XX (floor)
      return rooms.filter(([_, r]) => r.substring(0, r.length - 2) === floor);
    case "Rosalie K. Stahl Bldg":
      return rooms.filter(([_, r]) => r[0] === floor);
    case "Samia Academic Center":
      return rooms.filter(([_, r]) => r[0] === floor);
    case "Sargent Hall":
      return rooms.filter(([_, r]) => r[0] === floor);
    default:
      return rooms;
  }
};

export const floorMap: Map<
  App.Building,
  {
    /**
     * An array of floor numbers for the building. Floors are rendered in the order they appear in the array.
     */
    floors: string[];
    /**
     * A mapping between model names and their respective file paths and heights. The height is the height of the model in units.
     */
    modelData: {
      /**
       * The default model to be used for each floor. If a floor is not mapped to a custom model with the modelMap property, then it will use this default model.
       */
      default: [string, number];
      /**
       * An optional roof model to be used after every floor is rendered.
       */
      roof?: [string, number];
      /**
       * Optional custom models for specific floors. The key is referenced in the modelMap property to determine which model to use for a specific floor.
       */
      [key: string]: [string, number] | undefined;
    },
    /**
     * A mapping between floor numbers and custom models.
     */
    modelMap?: {
      // FIXME: why is this union of string | undefined necessary? removing undefined causes ts err 2322
      [key: string]: string | undefined;
    }
  }
> = new Map([
  // SAWYER: A, B, 1-11
  [
    "Sawyer",
    {
      floors: [
        "A",
        "B",
        ...Array.from({ length: 11 }).map((_, i) => (i + 1).toString()),
      ],
      modelMap: {
        "11": "top",
      },
      modelData: {
        default: ["/sawyer/default.gltf", 3.0727],
        top: ["/sawyer/top.gltf", 5.84639],
        roof: ["/sawyer/roof.gltf", 5.10275],
      }
    },
  ],
  // STAHL: 1-9 (but show till 11)
  [
    "Rosalie K. Stahl Bldg",
    {
      floors: Array.from({ length: 11 }).map((_, i) => (i + 1).toString()),
      modelMap: {
        "1": "lobby",
      },
      modelData: {
        lobby: ["/stahl/lobby.gltf", 5],
        default: ["/stahl/default.gltf", 4.02968],
        roof: ["/stahl/roof.gltf", 15.5444],
      }
    },
  ],
  // SAMIA: B, 1-8
  [
    "Samia Academic Center",
    {
      floors: [
        "B",
        ...Array.from({ length: 8 }).map((_, i) => (i + 1).toString()),
      ],
      modelMap: {
        "B": "sub",
        "1": "lobby",
        "2": "default2",
      },
      modelData: {
        sub: ["/samia/sub.gltf", 6.80336],
        lobby: ["/samia/lobby.gltf", 6.81531],
        default2: ["/samia/default2.gltf", 6.80336],
        default: ["/samia/default.gltf", 6.80336],
        roof: ["/samia/roof.gltf", 5.90007],
      }
    },
  ],
  // SARGENT: 1-5
  [
    "Sargent Hall",
    {
      floors: Array.from({ length: 5 }).map((_, i) => (i + 1).toString()),
      modelMap: {
        "1": "lobby",
      },
      modelData: {
        lobby: ["/sargent/lobby.gltf", 8.40353],
        default: ["/sargent/default.gltf", 4.84507],
        roof: ["/sargent/roof.gltf", 14.3882],
      }
    },
  ],
  // BEACON: 1
  ["1 Beacon", {
    floors: ["1"],
    modelData: {
      default: ["/beacon/default.gltf", 8],
      roof: ["/beacon/roof.gltf", 147.901],
    }
  }],
]);
