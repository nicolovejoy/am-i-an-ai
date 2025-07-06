// Tests for Kafka Sample Data Population Script
// TDD approach: test the population logic before implementation

import { 
  KafkaPopulator,
  PopulationConfig,
  PopulationResult 
} from './populate-kafka-samples';

// Mock kafkajs for testing
jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    producer: jest.fn().mockReturnValue({
      connect: jest.fn(),
      send: jest.fn(),
      disconnect: jest.fn()
    }),
    admin: jest.fn().mockReturnValue({
      connect: jest.fn(),
      createTopics: jest.fn(),
      disconnect: jest.fn()
    })
  }))
}));

// Mock AWS SDK
jest.mock('@aws-sdk/client-kafka', () => ({
  KafkaClient: jest.fn(),
  GetBootstrapBrokersCommand: jest.fn()
}));

describe('Kafka Sample Data Population Script', () => {
  let mockProducer: any;
  let mockAdmin: any;
  let populator: KafkaPopulator;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    const { Kafka } = require('kafkajs');
    const mockKafka = new Kafka();
    mockProducer = mockKafka.producer();
    mockAdmin = mockKafka.admin();
    
    populator = new KafkaPopulator({
      clusterArn: 'arn:aws:kafka:us-east-1:123456789:cluster/test',
      region: 'us-east-1'
    });
  });

  describe('Population Configuration', () => {
    test('accepts valid configuration options', () => {
      const config: PopulationConfig = {
        matchCount: 15,
        topicName: 'match-events',
        batchSize: 100,
        retryAttempts: 3,
        dryRun: false
      };

      expect(() => populator.validateConfig(config)).not.toThrow();
    });

    test('validates match count limits', () => {
      const invalidConfig: PopulationConfig = {
        matchCount: 0,
        topicName: 'match-events',
        batchSize: 100,
        retryAttempts: 3,
        dryRun: false
      };

      expect(() => populator.validateConfig(invalidConfig)).toThrow('Match count must be between 1 and 100');
    });

    test('validates topic name format', () => {
      const invalidConfig: PopulationConfig = {
        matchCount: 10,
        topicName: '',
        batchSize: 100,
        retryAttempts: 3,
        dryRun: false
      };

      expect(() => populator.validateConfig(invalidConfig)).toThrow('Topic name is required');
    });

    test('sets reasonable defaults', () => {
      const defaults = populator.getDefaults();

      expect(defaults.matchCount).toBe(10);
      expect(defaults.topicName).toBe('match-events');
      expect(defaults.batchSize).toBe(50);
      expect(defaults.retryAttempts).toBe(3);
      expect(defaults.dryRun).toBe(false);
    });
  });

  describe('Kafka Connection Management', () => {
    test('connects to MSK cluster successfully', async () => {
      mockProducer.connect.mockResolvedValue(undefined);
      mockAdmin.connect.mockResolvedValue(undefined);

      await populator.connect();

      expect(mockProducer.connect).toHaveBeenCalled();
      expect(mockAdmin.connect).toHaveBeenCalled();
    });

    test('handles connection failures gracefully', async () => {
      mockProducer.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(populator.connect()).rejects.toThrow('Connection failed');
    });

    test('disconnects properly', async () => {
      mockProducer.disconnect.mockResolvedValue(undefined);
      mockAdmin.disconnect.mockResolvedValue(undefined);

      await populator.disconnect();

      expect(mockProducer.disconnect).toHaveBeenCalled();
      expect(mockAdmin.disconnect).toHaveBeenCalled();
    });
  });

  describe('Topic Management', () => {
    test('creates topic if it does not exist', async () => {
      mockAdmin.createTopics.mockResolvedValue(true);

      await populator.ensureTopicExists('test-topic');

      expect(mockAdmin.createTopics).toHaveBeenCalledWith({
        topics: [{
          topic: 'test-topic',
          numPartitions: 3,
          replicationFactor: 2,
          configEntries: [
            { name: 'retention.ms', value: '-1' }, // Infinite retention
            { name: 'cleanup.policy', value: 'compact,delete' }
          ]
        }]
      });
    });

    test('handles existing topic gracefully', async () => {
      mockAdmin.createTopics.mockResolvedValue(false);

      await expect(populator.ensureTopicExists('existing-topic')).resolves.not.toThrow();
    });
  });

  describe('Event Publishing', () => {
    test('publishes events in batches', async () => {
      const events = Array.from({ length: 150 }, (_, i) => ({
        topic: 'match-events',
        key: `match_${i}`,
        value: JSON.stringify({ eventId: `evt_${i}`, data: {} }),
        timestamp: Date.now()
      }));

      mockProducer.send.mockResolvedValue({ recordMetadata: [] });

      const result = await populator.publishEvents(events, 50);

      // Should send in 3 batches (50, 50, 50)
      expect(mockProducer.send).toHaveBeenCalledTimes(3);
      expect(result.successCount).toBe(150);
      expect(result.errorCount).toBe(0);
    });

    test('handles partial batch failures', async () => {
      const events = Array.from({ length: 100 }, (_, i) => ({
        topic: 'match-events',
        key: `match_${i}`,
        value: JSON.stringify({ eventId: `evt_${i}` }),
        timestamp: Date.now()
      }));

      mockProducer.send
        .mockResolvedValueOnce({ recordMetadata: new Array(50) }) // First batch succeeds
        .mockRejectedValueOnce(new Error('Batch failed')); // Second batch fails

      const result = await populator.publishEvents(events, 50);

      expect(result.successCount).toBe(50);
      expect(result.errorCount).toBe(50);
      expect(result.errors).toHaveLength(1);
    });

    test('retries failed batches', async () => {
      const events = Array.from({ length: 50 }, (_, i) => ({
        topic: 'match-events',
        key: `match_${i}`,
        value: JSON.stringify({ eventId: `evt_${i}` }),
        timestamp: Date.now()
      }));

      mockProducer.send
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ recordMetadata: new Array(50) });

      const result = await populator.publishEvents(events, 50);

      expect(mockProducer.send).toHaveBeenCalledTimes(2);
      expect(result.successCount).toBe(50);
      expect(result.errorCount).toBe(0);
    });
  });

  describe('Full Population Process', () => {
    test('completes full population successfully', async () => {
      // Mock successful operations
      mockProducer.connect.mockResolvedValue(undefined);
      mockAdmin.connect.mockResolvedValue(undefined);
      mockAdmin.createTopics.mockResolvedValue(true);
      mockProducer.send.mockResolvedValue({ recordMetadata: [] });

      const config: PopulationConfig = {
        matchCount: 5,
        topicName: 'match-events',
        batchSize: 25,
        retryAttempts: 3,
        dryRun: false
      };

      const result: PopulationResult = await populator.populate(config);

      expect(result.success).toBe(true);
      expect(result.matchesGenerated).toBe(5);
      expect(result.eventsGenerated).toBeGreaterThan(100); // 5 matches * ~35 events each
      expect(result.eventsPublished).toBe(result.eventsGenerated);
      expect(result.duration).toBeGreaterThan(0);
    });

    test('handles dry run mode', async () => {
      const config: PopulationConfig = {
        matchCount: 3,
        topicName: 'match-events',
        batchSize: 25,
        retryAttempts: 3,
        dryRun: true
      };

      const result: PopulationResult = await populator.populate(config);

      expect(result.success).toBe(true);
      expect(result.matchesGenerated).toBe(3);
      expect(result.eventsPublished).toBe(0); // No actual publishing in dry run
      expect(mockProducer.send).not.toHaveBeenCalled();
    });

    test('reports detailed statistics', async () => {
      mockProducer.connect.mockResolvedValue(undefined);
      mockAdmin.connect.mockResolvedValue(undefined);
      mockAdmin.createTopics.mockResolvedValue(true);
      mockProducer.send.mockResolvedValue({ recordMetadata: [] });

      const config: PopulationConfig = {
        matchCount: 2,
        topicName: 'match-events',
        batchSize: 20,
        retryAttempts: 3,
        dryRun: false
      };

      const result: PopulationResult = await populator.populate(config);

      expect(result.statistics).toBeDefined();
      expect(result.statistics.avgEventsPerMatch).toBeGreaterThan(30);
      expect(result.statistics.batchCount).toBeGreaterThan(0);
      expect(result.statistics.avgBatchSize).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('gracefully handles generator failures', async () => {
      // Mock generator to fail
      jest.doMock('../kafka-sample-generator', () => ({
        generateCompleteMatch: jest.fn().mockRejectedValue(new Error('Generator failed'))
      }));

      const config: PopulationConfig = {
        matchCount: 1,
        topicName: 'match-events',
        batchSize: 25,
        retryAttempts: 3,
        dryRun: false
      };

      const result = await populator.populate(config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Generator failed');
    });

    test('provides detailed error information', async () => {
      mockProducer.connect.mockRejectedValue(new Error('Authentication failed'));

      const config: PopulationConfig = {
        matchCount: 1,
        topicName: 'match-events',
        batchSize: 25,
        retryAttempts: 3,
        dryRun: false
      };

      const result = await populator.populate(config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
      expect(result.phase).toBe('connection');
    });
  });

  describe('Progress Reporting', () => {
    test('reports progress during population', async () => {
      const progressCallback = jest.fn();
      
      mockProducer.connect.mockResolvedValue(undefined);
      mockAdmin.connect.mockResolvedValue(undefined);
      mockProducer.send.mockResolvedValue({ recordMetadata: [] });

      const config: PopulationConfig = {
        matchCount: 3,
        topicName: 'match-events',
        batchSize: 25,
        retryAttempts: 3,
        dryRun: false,
        onProgress: progressCallback
      };

      await populator.populate(config);

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: expect.stringMatching(/connecting|generating|publishing|complete/),
          progress: expect.any(Number)
        })
      );
    });
  });
});