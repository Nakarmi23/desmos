import type { UserListRow, UserStatus } from "@/modules/users/user";

type Role = UserListRow["roles"][number];

const ADMINISTRATOR: Role = { id: "role_admin", name: "Administrator" };
const MEMBER: Role = { id: "role_member", name: "Member" };
const VIEWER: Role = { id: "role_viewer", name: "Viewer" };

/** The fixture's Roles (what `roles.list` would return). */
export const FIXTURE_ROLES: readonly Role[] = [ADMINISTRATOR, MEMBER, VIEWER];

// Users without Roles yet; `USERS` hands them out by ROLE_PATTERN.
type RolelessUser = Omit<UserListRow, "roles">;

const HAND_WRITTEN_USERS: RolelessUser[] = [
  {
    id: "usr_001",
    name: "Ava Thompson",
    username: "ava.thompson",
    email: "ava.thompson@example.com",
    status: "active",
    isInitial: true,
    createdAt: new Date("2023-02-14T09:15:00Z"),
  },
  {
    id: "usr_002",
    name: "Liam Chen",
    username: "liam.chen",
    email: "liam.chen@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2023-03-22T13:40:00Z"),
  },
  {
    id: "usr_003",
    name: "Sofia Rossi",
    username: "sofia.rossi",
    email: "sofia.rossi@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2023-04-05T08:05:00Z"),
  },
  {
    id: "usr_004",
    name: "Noah Patel",
    username: "noah.patel",
    email: "noah.patel@example.com",
    status: "suspended",
    isInitial: false,
    createdAt: new Date("2023-05-11T17:22:00Z"),
  },
  {
    id: "usr_005",
    name: "Emma Garcia",
    username: "emma.garcia",
    email: "emma.garcia@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2023-06-01T11:00:00Z"),
  },
  {
    id: "usr_006",
    name: "Oliver Smith",
    username: "oliver.smith",
    email: "oliver.smith@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2023-06-19T15:47:00Z"),
  },
  {
    id: "usr_007",
    name: "Mia Johansson",
    username: "mia.johansson",
    email: "mia.johansson@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2023-07-08T10:30:00Z"),
  },
  {
    id: "usr_008",
    name: "Lucas Martin",
    username: "lucas.martin",
    email: "lucas.martin@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2023-07-27T09:12:00Z"),
  },
  {
    id: "usr_009",
    name: "Isabella Kim",
    username: "isabella.kim",
    email: "isabella.kim@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2023-08-14T14:05:00Z"),
  },
  {
    id: "usr_010",
    name: "Ethan Müller",
    username: "ethan.muller",
    email: "ethan.muller@example.com",
    status: "suspended",
    isInitial: false,
    createdAt: new Date("2023-09-02T16:18:00Z"),
  },
  {
    id: "usr_011",
    name: "Charlotte Dubois",
    username: "charlotte.dubois",
    email: "charlotte.dubois@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2023-09-29T08:50:00Z"),
  },
  {
    id: "usr_012",
    name: "James Wilson",
    username: "james.wilson",
    email: "james.wilson@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2023-10-17T12:33:00Z"),
  },
  {
    id: "usr_013",
    name: "Amelia Novak",
    username: "amelia.novak",
    email: "amelia.novak@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2023-11-03T10:00:00Z"),
  },
  {
    id: "usr_014",
    name: "Benjamin Clark",
    username: "benjamin.clark",
    email: "benjamin.clark@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2023-11-21T13:26:00Z"),
  },
  {
    id: "usr_015",
    name: "Harper Nguyen",
    username: "harper.nguyen",
    email: "harper.nguyen@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2023-12-09T09:44:00Z"),
  },
  {
    id: "usr_016",
    name: "Elijah Brown",
    username: "elijah.brown",
    email: "elijah.brown@example.com",
    status: "suspended",
    isInitial: false,
    createdAt: new Date("2023-12-28T15:15:00Z"),
  },
  {
    id: "usr_017",
    name: "Evelyn Suzuki",
    username: "evelyn.suzuki",
    email: "evelyn.suzuki@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2024-01-15T11:37:00Z"),
  },
  {
    id: "usr_018",
    name: "Henry Walker",
    username: "henry.walker",
    email: "henry.walker@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2024-02-02T08:20:00Z"),
  },
  {
    id: "usr_019",
    name: "Abigail Costa",
    username: "abigail.costa",
    email: "abigail.costa@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2024-02-20T14:52:00Z"),
  },
  {
    id: "usr_020",
    name: "Daniel Andersen",
    username: "daniel.andersen",
    email: "daniel.andersen@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2024-03-10T10:05:00Z"),
  },
  {
    id: "usr_021",
    name: "Ella Fischer",
    username: "ella.fischer",
    email: "ella.fischer@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2024-03-28T16:41:00Z"),
  },
  {
    id: "usr_022",
    name: "Matthew Okafor",
    username: "matthew.okafor",
    email: "matthew.okafor@example.com",
    status: "suspended",
    isInitial: false,
    createdAt: new Date("2024-04-16T09:09:00Z"),
  },
  {
    id: "usr_023",
    name: "Grace Lindqvist",
    username: "grace.lindqvist",
    email: "grace.lindqvist@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2024-05-04T13:00:00Z"),
  },
  {
    id: "usr_024",
    name: "Samuel Ibrahim",
    username: "samuel.ibrahim",
    email: "samuel.ibrahim@example.com",
    status: "active",
    isInitial: false,
    createdAt: new Date("2024-05-22T15:30:00Z"),
  },
];

const FIRST_NAMES = [
  "Zoe",
  "Mateo",
  "Layla",
  "Kai",
  "Nora",
  "Felix",
  "Iris",
  "Omar",
  "Ruby",
  "Hugo",
  "Yara",
  "Theo",
  "Lena",
  "Diego",
  "Maya",
  "Arjun",
  "Clara",
  "Jonas",
  "Aisha",
  "Leo",
] as const;

const LAST_NAMES = [
  "Alvarez",
  "Bennett",
  "Carvalho",
  "Dahl",
  "Eriksen",
  "Fontaine",
  "Grant",
  "Haddad",
  "Ivanov",
  "Jensen",
  "Kowalski",
  "Lopez",
  "Moreau",
  "Nakamura",
  "Oliveira",
  "Petrov",
  "Quinn",
  "Reyes",
  "Silva",
  "Tanaka",
] as const;

// A repeating pattern keeps the spread (mostly active) stable across edits.
const STATUS_PATTERN: UserStatus[] = [
  "active",
  "active",
  "active",
  "suspended",
  "active",
  "active",
  "suspended",
  "active",
  "active",
  "active",
];

// A repeating pattern of held Roles, mostly one, some several, some none. The
// first User (the Initial User) holds Administrator.
const ROLE_PATTERN: Role[][] = [
  [ADMINISTRATOR],
  [MEMBER],
  [VIEWER],
  [MEMBER, VIEWER],
  [MEMBER],
  [],
  [ADMINISTRATOR, MEMBER],
  [VIEWER],
  [MEMBER],
  [VIEWER],
  [MEMBER],
];

const TOTAL_USERS = 200;
const DAY_MS = 24 * 60 * 60 * 1000;
const FIRST_GENERATED_AT = Date.parse("2024-06-01T10:00:00Z");

// Deterministic (no randomness), so tests and stories see the same rows every run.
function generateUsers(
  count: number,
  taken: ReadonlySet<string>,
): RolelessUser[] {
  const users: RolelessUser[] = [];
  const usernames = new Set(taken);
  for (let i = 0; users.length < count; i++) {
    const first = FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
    const last =
      LAST_NAMES[
        (i * 3 + Math.floor(i / FIRST_NAMES.length)) % LAST_NAMES.length
      ];
    const username = `${first}.${last}`.toLowerCase();
    if (usernames.has(username)) continue;
    usernames.add(username);

    const n = users.length;
    users.push({
      id: `usr_${String(HAND_WRITTEN_USERS.length + n + 1).padStart(3, "0")}`,
      name: `${first} ${last}`,
      username,
      email: `${username}@example.com`,
      status: STATUS_PATTERN[(n * 3) % STATUS_PATTERN.length],
      isInitial: false,
      createdAt: new Date(
        FIRST_GENERATED_AT + n * 2 * DAY_MS + (n % 7) * 3_600_000,
      ),
    });
  }
  return users;
}

export const USERS: UserListRow[] = [
  ...HAND_WRITTEN_USERS,
  ...generateUsers(
    TOTAL_USERS - HAND_WRITTEN_USERS.length,
    new Set(HAND_WRITTEN_USERS.map((user) => user.username)),
  ),
].map((user, i) => ({ ...user, roles: ROLE_PATTERN[i % ROLE_PATTERN.length] }));
