export type UserRole = "admin" | "member" | "viewer";

export type UserStatus = "active" | "invited" | "suspended";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
};

const HAND_WRITTEN_USERS: User[] = [
  {
    id: "usr_001",
    name: "Ava Thompson",
    email: "ava.thompson@example.com",
    role: "admin",
    status: "active",
    createdAt: new Date("2023-02-14T09:15:00Z"),
  },
  {
    id: "usr_002",
    name: "Liam Chen",
    email: "liam.chen@example.com",
    role: "member",
    status: "active",
    createdAt: new Date("2023-03-22T13:40:00Z"),
  },
  {
    id: "usr_003",
    name: "Sofia Rossi",
    email: "sofia.rossi@example.com",
    role: "viewer",
    status: "invited",
    createdAt: new Date("2023-04-05T08:05:00Z"),
  },
  {
    id: "usr_004",
    name: "Noah Patel",
    email: "noah.patel@example.com",
    role: "member",
    status: "suspended",
    createdAt: new Date("2023-05-11T17:22:00Z"),
  },
  {
    id: "usr_005",
    name: "Emma Garcia",
    email: "emma.garcia@example.com",
    role: "admin",
    status: "active",
    createdAt: new Date("2023-06-01T11:00:00Z"),
  },
  {
    id: "usr_006",
    name: "Oliver Smith",
    email: "oliver.smith@example.com",
    role: "member",
    status: "active",
    createdAt: new Date("2023-06-19T15:47:00Z"),
  },
  {
    id: "usr_007",
    name: "Mia Johansson",
    email: "mia.johansson@example.com",
    role: "viewer",
    status: "active",
    createdAt: new Date("2023-07-08T10:30:00Z"),
  },
  {
    id: "usr_008",
    name: "Lucas Martin",
    email: "lucas.martin@example.com",
    role: "member",
    status: "invited",
    createdAt: new Date("2023-07-27T09:12:00Z"),
  },
  {
    id: "usr_009",
    name: "Isabella Kim",
    email: "isabella.kim@example.com",
    role: "viewer",
    status: "active",
    createdAt: new Date("2023-08-14T14:05:00Z"),
  },
  {
    id: "usr_010",
    name: "Ethan Müller",
    email: "ethan.muller@example.com",
    role: "member",
    status: "suspended",
    createdAt: new Date("2023-09-02T16:18:00Z"),
  },
  {
    id: "usr_011",
    name: "Charlotte Dubois",
    email: "charlotte.dubois@example.com",
    role: "admin",
    status: "active",
    createdAt: new Date("2023-09-29T08:50:00Z"),
  },
  {
    id: "usr_012",
    name: "James Wilson",
    email: "james.wilson@example.com",
    role: "member",
    status: "active",
    createdAt: new Date("2023-10-17T12:33:00Z"),
  },
  {
    id: "usr_013",
    name: "Amelia Novak",
    email: "amelia.novak@example.com",
    role: "viewer",
    status: "invited",
    createdAt: new Date("2023-11-03T10:00:00Z"),
  },
  {
    id: "usr_014",
    name: "Benjamin Clark",
    email: "benjamin.clark@example.com",
    role: "member",
    status: "active",
    createdAt: new Date("2023-11-21T13:26:00Z"),
  },
  {
    id: "usr_015",
    name: "Harper Nguyen",
    email: "harper.nguyen@example.com",
    role: "admin",
    status: "active",
    createdAt: new Date("2023-12-09T09:44:00Z"),
  },
  {
    id: "usr_016",
    name: "Elijah Brown",
    email: "elijah.brown@example.com",
    role: "member",
    status: "suspended",
    createdAt: new Date("2023-12-28T15:15:00Z"),
  },
  {
    id: "usr_017",
    name: "Evelyn Suzuki",
    email: "evelyn.suzuki@example.com",
    role: "viewer",
    status: "active",
    createdAt: new Date("2024-01-15T11:37:00Z"),
  },
  {
    id: "usr_018",
    name: "Henry Walker",
    email: "henry.walker@example.com",
    role: "member",
    status: "active",
    createdAt: new Date("2024-02-02T08:20:00Z"),
  },
  {
    id: "usr_019",
    name: "Abigail Costa",
    email: "abigail.costa@example.com",
    role: "viewer",
    status: "invited",
    createdAt: new Date("2024-02-20T14:52:00Z"),
  },
  {
    id: "usr_020",
    name: "Daniel Andersen",
    email: "daniel.andersen@example.com",
    role: "admin",
    status: "active",
    createdAt: new Date("2024-03-10T10:05:00Z"),
  },
  {
    id: "usr_021",
    name: "Ella Fischer",
    email: "ella.fischer@example.com",
    role: "member",
    status: "active",
    createdAt: new Date("2024-03-28T16:41:00Z"),
  },
  {
    id: "usr_022",
    name: "Matthew Okafor",
    email: "matthew.okafor@example.com",
    role: "member",
    status: "suspended",
    createdAt: new Date("2024-04-16T09:09:00Z"),
  },
  {
    id: "usr_023",
    name: "Grace Lindqvist",
    email: "grace.lindqvist@example.com",
    role: "viewer",
    status: "active",
    createdAt: new Date("2024-05-04T13:00:00Z"),
  },
  {
    id: "usr_024",
    name: "Samuel Ibrahim",
    email: "samuel.ibrahim@example.com",
    role: "admin",
    status: "active",
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

// Repeating patterns keep the spread (mostly members, mostly active) stable across edits.
const ROLE_PATTERN: UserRole[] = [
  "member",
  "viewer",
  "member",
  "member",
  "viewer",
  "member",
  "admin",
  "viewer",
  "member",
  "member",
];
const STATUS_PATTERN: UserStatus[] = [
  "active",
  "active",
  "active",
  "invited",
  "active",
  "active",
  "suspended",
  "active",
  "active",
  "invited",
];

const TOTAL_USERS = 200;
const DAY_MS = 24 * 60 * 60 * 1000;
const FIRST_GENERATED_AT = Date.parse("2024-06-01T10:00:00Z");

// Deterministic (no randomness), so tests and stories see the same rows every run.
function generateUsers(count: number, taken: ReadonlySet<string>): User[] {
  const users: User[] = [];
  const emails = new Set(taken);
  for (let i = 0; users.length < count; i++) {
    const first = FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
    const last =
      LAST_NAMES[
        (i * 3 + Math.floor(i / FIRST_NAMES.length)) % LAST_NAMES.length
      ];
    const email = `${first}.${last}@example.com`.toLowerCase();
    if (emails.has(email)) continue;
    emails.add(email);

    const n = users.length;
    users.push({
      id: `usr_${String(HAND_WRITTEN_USERS.length + n + 1).padStart(3, "0")}`,
      name: `${first} ${last}`,
      email,
      role: ROLE_PATTERN[n % ROLE_PATTERN.length],
      status: STATUS_PATTERN[(n * 3) % STATUS_PATTERN.length],
      createdAt: new Date(
        FIRST_GENERATED_AT + n * 2 * DAY_MS + (n % 7) * 3_600_000,
      ),
    });
  }
  return users;
}

export const USERS: User[] = [
  ...HAND_WRITTEN_USERS,
  ...generateUsers(
    TOTAL_USERS - HAND_WRITTEN_USERS.length,
    new Set(HAND_WRITTEN_USERS.map((user) => user.email)),
  ),
];
