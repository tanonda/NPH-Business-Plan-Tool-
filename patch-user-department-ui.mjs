import fs from 'node:fs';

const file = 'src/components/UserManagementPanel.tsx';

if (!fs.existsSync(file)) {
  console.error('Missing src/components/UserManagementPanel.tsx');
  process.exit(1);
}

let source = fs.readFileSync(file, 'utf8');

const backup = `${file}.bak-department-access`;
if (!fs.existsSync(backup)) {
  fs.writeFileSync(backup, source);
}

if (!source.includes("@/components/UserDepartmentAccessEditor")) {
  source = source.replace(
    "import { useCurrentUser, UserRole } from '@/components/useCurrentUser';",
    "import { useCurrentUser, UserRole } from '@/components/useCurrentUser';\nimport { UserDepartmentAccessEditor } from '@/components/UserDepartmentAccessEditor';"
  );
  console.log('Added UserDepartmentAccessEditor import.');
}

source = source.replace(
  '<th>Department access</th>',
  '<th>All departments</th>\n              <th>Assigned departments</th>'
);

source = source.replace(
  `<td>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(item.canAccessAllDepartments)}
                        onChange={(event) =>
                          void updateUser(item.id, {
                            canAccessAllDepartments: event.target.checked
                          })
                        }
                      />
                      All
                    </label>
                  </td>

                  <td>
                    {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString() : 'Never'}
                  </td>`,
  `<td>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(item.canAccessAllDepartments)}
                        onChange={(event) =>
                          void updateUser(item.id, {
                            canAccessAllDepartments: event.target.checked
                          })
                        }
                      />
                      All
                    </label>
                  </td>

                  <td>
                    <UserDepartmentAccessEditor
                      userId={item.id}
                      disabled={Boolean(item.canAccessAllDepartments)}
                    />
                  </td>

                  <td>
                    {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString() : 'Never'}
                  </td>`
);

source = source.replaceAll('colSpan={7}', 'colSpan={8}');

fs.writeFileSync(file, source);
console.log('Done. User Management now includes assigned department controls.');
