import { Repository } from 'typeorm';
import { RoleTypeOrmRepository } from './role.typeorm-repository';
import { RolesOrmEntity } from '../entities/roles.orm-entity';
import { RolePermissionOrmEntity } from '../entities/role-permission.orm-entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
  delete: jest.fn(),
  existsBy: jest.fn(),
});

type MockRepo = ReturnType<typeof mockRepo>;

describe('RoleTypeOrmRepository', () => {
  let roles: MockRepo;
  let rolePermissions: MockRepo;
  let repository: RoleTypeOrmRepository;

  beforeEach(() => {
    roles = mockRepo();
    rolePermissions = mockRepo();
    repository = new RoleTypeOrmRepository(
      roles as unknown as Repository<RolesOrmEntity>,
      rolePermissions as unknown as Repository<RolePermissionOrmEntity>,
    );
  });

  describe('findById', () => {
    it('requests the nested permission relation and maps it onto the domain role', async () => {
      roles.findOne.mockResolvedValue({
        id: 'r1',
        name: 'admin',
        rolePermissions: [
          {
            id: 'rp1',
            permission: { id: 'p1', action: 'read', subject: 'User' },
          },
        ],
      });

      const role = await repository.findById('r1');

      expect(roles.findOne).toHaveBeenCalledWith({
        where: { id: 'r1' },
        relations: { rolePermissions: { permission: true } },
      });
      expect(role?.name).toBe('admin');
      expect(role?.permissions).toHaveLength(1);
      expect(role?.permissions[0].action).toBe('read');
      expect(role?.permissions[0].subject).toBe('User');
    });

    it('returns null when the role does not exist', async () => {
      roles.findOne.mockResolvedValue(null);
      await expect(repository.findById('missing')).resolves.toBeNull();
    });
  });

  describe('assignPermission', () => {
    it('creates the join row when the link is absent', async () => {
      rolePermissions.findOne.mockResolvedValue(null);
      rolePermissions.create.mockImplementation((value: unknown) => value);

      await repository.assignPermission('r1', 'p1');

      expect(rolePermissions.create).toHaveBeenCalledWith({
        role: { id: 'r1' },
        permission: { id: 'p1' },
      });
      expect(rolePermissions.save).toHaveBeenCalled();
    });

    it('does not duplicate an existing link', async () => {
      rolePermissions.findOne.mockResolvedValue({ id: 'rp1' });

      await repository.assignPermission('r1', 'p1');

      expect(rolePermissions.save).not.toHaveBeenCalled();
    });
  });

  describe('removePermission', () => {
    it('removes the existing join row', async () => {
      rolePermissions.findOne.mockResolvedValue({ id: 'rp1' });

      await repository.removePermission('r1', 'p1');

      expect(rolePermissions.remove).toHaveBeenCalledWith({ id: 'rp1' });
    });

    it('is a no-op when the link is absent', async () => {
      rolePermissions.findOne.mockResolvedValue(null);

      await repository.removePermission('r1', 'p1');

      expect(rolePermissions.remove).not.toHaveBeenCalled();
    });
  });

  it('inherits delete and exists from BaseTypeOrmRepository', async () => {
    roles.existsBy.mockResolvedValue(true);

    await expect(repository.exists('r1')).resolves.toBe(true);
    await repository.delete('r1');

    expect(roles.delete).toHaveBeenCalledWith('r1');
  });
});
