import bcrypt from 'bcryptjs';
import { db } from './db';

const hash = bcrypt.hashSync('charvik@temp2026', 10);

const existing = db.prepare('SELECT id FROM administrators WHERE email_or_username = ?').get('tempadmin@charvik.com') as any;

if (existing) {
  db.prepare('UPDATE administrators SET password_hash = ?, status = ? WHERE id = ?').run(hash, 'Active', existing.id);
} else {
  db.prepare(`
    INSERT INTO administrators (name, email_or_username, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?)
  `).run('Temporary Admin', 'tempadmin@charvik.com', hash, 'Administrator', 'Active');
}

console.log('Temporary admin created successfully');
