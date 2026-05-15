import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/server/prisma';

const BCRYPT_ROUNDS = 12;
const DEV_PASSWORD = 'password1234';

const users = [
	{ email: 'admin@bazaarlink.dev', role: 'ADMIN' as const },
	{ email: 'buyer@bazaarlink.dev', role: 'BUYER' as const },
	{ email: 'supplier@bazaarlink.dev', role: 'SUPPLIER' as const },
	{ email: 'inspector@bazaarlink.dev', role: 'INSPECTOR' as const }
];

const leads = [
	{
		id: '11111111-1111-1111-1111-111111111111',
		email: 'prospect.buyer@example.com',
		name: 'Sara (Buyer Demo)',
		message:
			'We run a boutique rug import shop in Berlin and are looking for a regular sourcing channel for Afghan kilims and tribal pieces.',
		roleIntent: 'BUYER' as const,
		status: 'NEW' as const
	},
	{
		id: '22222222-2222-2222-2222-222222222222',
		email: 'prospect.supplier@example.com',
		name: 'Ahmad (Supplier Demo)',
		message:
			'Family workshop in Mazar-i-Sharif — 30+ pieces ready monthly, mostly traditional Khal Mohammadi. Looking for export-side partner.',
		roleIntent: 'SUPPLIER' as const,
		status: 'NEW' as const
	},
	{
		id: '33333333-3333-3333-3333-333333333333',
		email: 'contacted.lead@example.com',
		name: 'Maya',
		message:
			'Interior designer in Dubai. Building inventory for a hospitality project. Need 40-50 hand-knotted rugs in 3 months.',
		roleIntent: 'BUYER' as const,
		status: 'CONTACTED' as const
	},
	{
		id: '44444444-4444-4444-4444-444444444444',
		email: 'rejected.spam@example.com',
		message: 'CHEAP RUGS BULK ORDER PLEASE CONTACT MY WHATSAPP +123456789',
		status: 'REJECTED' as const
	}
];

async function main() {
	if (process.env.NODE_ENV === 'production') {
		throw new Error('refusing to seed production');
	}

	console.log('Seeding users…');
	const passwordHash = await bcrypt.hash(DEV_PASSWORD, BCRYPT_ROUNDS);
	for (const u of users) {
		await prisma.user.upsert({
			where: { email: u.email },
			update: { role: u.role, mustChangePassword: false },
			create: {
				email: u.email,
				passwordHash,
				role: u.role,
				mustChangePassword: false
			}
		});
		console.log(`  ✓ ${u.role.padEnd(10)} ${u.email}`);
	}

	console.log('\nSeeding leads…');
	for (const l of leads) {
		const name = 'name' in l ? l.name : null;
		const roleIntent = 'roleIntent' in l ? l.roleIntent : null;
		await prisma.lead.upsert({
			where: { id: l.id },
			update: {
				email: l.email,
				name,
				message: l.message,
				roleIntent,
				status: l.status
			},
			create: {
				id: l.id,
				email: l.email,
				name,
				message: l.message,
				roleIntent,
				status: l.status
			}
		});
		console.log(`  ✓ ${l.status.padEnd(10)} ${l.email}`);
	}

	console.log(`\nDone. Dev password for all seeded users: ${DEV_PASSWORD}`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
