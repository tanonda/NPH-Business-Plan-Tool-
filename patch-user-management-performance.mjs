import fs from 'node:fs';

const file = 'src/components/UserManagementPanel.tsx';

if (!fs.existsSync(file)) {
  console.error('Missing src/components/UserManagementPanel.tsx');
  process.exit(1);
}

let source = fs.readFileSync(file, 'utf8');

const backup = `${file}.bak-performance`;
if (!fs.existsSync(backup)) {
  fs.writeFileSync(backup, source);
}

// Add departmentIds and Department type.
source = source.replace(
  `type ManagedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  canAccessAllDepartments?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
};`,
  `type ManagedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  canAccessAllDepartments?: boolean;
  departmentIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
};

type Department = {
  id: string;
  code?: string | null;
  name?: string | null;
};`
);

// Add departments state.
source = source.replace(
  `const [users, setUsers] = useState<ManagedUser[]>([]);`,
  `const [users, setUsers] = useState<ManagedUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);`
);

// Replace loadUsers function body with users + departments loading.
const loadUsersStart = source.indexOf('  async function loadUsers() {');
const createUserStart = source.indexOf('  async function createUser', loadUsersStart);

if (loadUsersStart !== -1 && createUserStart !== -1) {
  const nextLoadUsers = `  async function loadUsers() {
    if (!isAdmin) return;

    setLoading(true);
    setMessage('');

    try {
      const [usersRes, departmentsRes] = await Promise.all([
        fetch('/api/users', { cache: 'no-store' }),
        fetch('/api/departments', { cache: 'no-store' })
      ]);

      if (!usersRes.ok) {
        const err = await usersRes.json().catch(() => ({}));
        throw new Error(err.error || 'Could not load users.');
      }

      setUsers(await usersRes.json());

      if (departmentsRes.ok) {
        setDepartments(await departmentsRes.json());
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }

`;

  source = source.slice(0, loadUsersStart) + nextLoadUsers + source.slice(createUserStart);
}

// Patch UserDepartmentAccessEditor props.
source = source.replace(
  `<UserDepartmentAccessEditor
                      userId={item.id}
                      disabled={Boolean(item.canAccessAllDepartments)}
                    />`,
  `<UserDepartmentAccessEditor
                      userId={item.id}
                      departments={departments}
                      initialDepartmentIds={item.departmentIds || []}
                      disabled={Boolean(item.canAccessAllDepartments)}
                      onSaved={() => void loadUsers()}
                    />`
);

fs.writeFileSync(file, source);
console.log('Done. User Management now loads departments once.');
