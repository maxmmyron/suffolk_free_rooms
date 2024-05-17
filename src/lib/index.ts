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
      lobby?: [string, number]
      default: [string, number];
      roof?: [string, number?];
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
      modelData: {
        default: ["/sawyer/floor.gltf", 4.02968],
        roof: ["/sawyer/roof.gltf"],
      }
    },
  ],
  // STAHL: 1-9 (but show till 11)
  [
    "Rosalie K. Stahl Bldg",
    {
      floors: [
        ...Array.from({ length: 11 }).map((_, i) => (i + 1).toString()),
      ],
      modelData: {
        lobby: ["/stahl/lobby.gltf", 5],
        default: ["/stahl/floor.gltf", 4.02968],
        roof: ["/stahl/roof.gltf"],
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
      modelData: {
        default: ["/samia/floor.gltf", 4.02968],
        roof: ["/samia/roof.gltf"],
      }
    },
  ],
  // SARGENT: 1-5
  [
    "Sargent Hall",
    {
      floors: [
        ...Array.from({ length: 5 }).map((_, i) => (i + 1).toString()),
      ],
      modelData: {
        default: ["/sargent/floor.gltf", 4.02968],
        roof: ["/sawyer/roof.gltf"],
      }
    },
  ],
  // BEACON: 1
  ["1 Beacon", {
    floors: ["1"],
    modelData: {
      default: ["/beacon/floor.gltf", 4.02968],
    }
  }],
]);
