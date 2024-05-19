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
    floors: string[];
    modelData: {
      default: [string, number];
      roof?: [string, number];
      [key: string]: [string, number] | undefined;
    },
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
        "0": "lobby",
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
        "0": "lobby",
      },
      modelData: {
        sub: ["/samia/sub.gltf", 4.0],
        lobby: ["/samia/lobby.gltf", 5.00],
        default: ["/samia/default.gltf", 3.75],
        roof: ["/samia/roof.gltf", 8.53129],
      }
    },
  ],
  // SARGENT: 1-5
  [
    "Sargent Hall",
    {
      floors: Array.from({ length: 5 }).map((_, i) => (i + 1).toString()),
      modelData: {
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
