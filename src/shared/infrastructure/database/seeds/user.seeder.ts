import { Seeder } from 'typeorm-extension';
import { DataSource } from 'typeorm';
import { UserOrmEntity } from '@modules/user/infrastructure/persistence/entities/user.orm-entity';
import { RolesOrmEntity } from '@modules/authorization/infrastructure/persistence/entities/roles.orm-entity';
import { UserRoleOrmEntity } from '@modules/authorization/infrastructure/persistence/entities/user-role.orm-entity';
import * as bcrypt from 'bcrypt';

export default class UserSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<any> {
    const userRepo = dataSource.getRepository(UserOrmEntity);
    const roleRepo = dataSource.getRepository(RolesOrmEntity);
    const userRoleRepo = dataSource.getRepository(UserRoleOrmEntity);

    const users = [
      {
        email: 'hieunq2000@gmail.com',
        pass: 'hieunq@1',
        name: 'Hieu Nguyen',
        role: 'admin',
      },
      {
        email: 'nouser@gmail.com',
        pass: 'nouser@1',
        name: 'No Permission User',
        role: 'guest',
      },
    ];

    for (const u of users) {
      let user = await userRepo.findOneBy({ email: u.email });
      if (!user) {
        const hashedPassword = await bcrypt.hash(u.pass, 10);
        user = await userRepo.save(
          userRepo.create({
            email: u.email,
            password: hashedPassword,
            displayName: u.name,
            isActive: true,
          }),
        );
        console.log(`Seeded user: ${u.email}`);
      }

      const role = await roleRepo.findOneBy({ name: u.role });
      if (role) {
        const exists = await userRoleRepo.findOne({
          where: { user: { id: user.id }, role: { id: role.id } },
        });
        if (!exists) {
          await userRoleRepo.save(userRoleRepo.create({ user, role }));
          console.log(`Assigned role ${u.role} -> ${u.email}`);
        }
      }
    }
  }
}
