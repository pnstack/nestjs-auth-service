import { ScylladbConfig } from '../../../../src/shared/database/scylladb/scylladb.config';
import { ScylladbModule } from '../../../../src/shared/database/scylladb/scylladb.module';
import { ScylladbService } from '../../../../src/shared/database/scylladb/scylladb.service';
import { UserSessionRepository } from '../../../../src/shared/database/scylladb/repositories/user-session.repository';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

// Mock cassandra-driver to avoid actual connections
jest.mock('cassandra-driver', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    execute: jest.fn().mockResolvedValue({ rows: [] }),
    shutdown: jest.fn().mockResolvedValue(undefined),
    batch: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('ScylladbModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ScylladbModule],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                SCYLLADB_CONTACT_POINTS: 'localhost',
                SCYLLADB_LOCAL_DC: 'datacenter1',
                SCYLLADB_KEYSPACE: 'test_keyspace',
                SCYLLADB_CONNECT_TIMEOUT: 30000,
                SCYLLADB_READ_TIMEOUT: 30000,
                SCYLLADB_CORE_CONNECTIONS: 2,
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    })
      .overrideProvider(ScylladbService)
      .useValue({
        getClient: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue({ rows: [] }),
          shutdown: jest.fn().mockResolvedValue(undefined),
        }),
        executeQuery: jest.fn().mockResolvedValue({ rows: [] }),
        executeBatch: jest.fn().mockResolvedValue(undefined),
      })
      .compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('Module Structure', () => {
    it('should compile successfully', () => {
      expect(module).toBeDefined();
    });

    it('should provide ScylladbService', () => {
      const service = module.get<ScylladbService>(ScylladbService);
      expect(service).toBeDefined();
    });

    it('should provide ScylladbConfig', () => {
      const config = module.get<ScylladbConfig>(ScylladbConfig);
      expect(config).toBeDefined();
    });

    it('should provide UserSessionRepository', () => {
      const repository = module.get<UserSessionRepository>(UserSessionRepository);
      expect(repository).toBeDefined();
    });

    it('should provide SCYLLA_CLIENT token', () => {
      const client = module.get('SCYLLA_CLIENT');
      expect(client).toBeDefined();
    });
  });

  describe('Component Interfaces', () => {
    it('UserSessionRepository should have correct properties', () => {
      const repository = module.get<UserSessionRepository>(UserSessionRepository);
      
      // Access protected properties through bracket notation for testing
      expect(repository['tableName']).toBe('user_sessions');
      expect(repository['primaryKey']).toBe('session_id');
    });

    it('UserSessionRepository should have required methods', () => {
      const repository = module.get<UserSessionRepository>(UserSessionRepository);
      
      expect(repository.createTable).toBeDefined();
      expect(repository.findActiveSessionsByUserId).toBeDefined();
      expect(repository.deactivateSession).toBeDefined();
      expect(repository.create).toBeDefined();
      expect(repository.findById).toBeDefined();
      expect(repository.update).toBeDefined();
      expect(repository.delete).toBeDefined();
    });

    it('ScylladbConfig should have createScyllaClient method', () => {
      const config = module.get<ScylladbConfig>(ScylladbConfig);
      expect(config.createScyllaClient).toBeDefined();
    });
  });
});