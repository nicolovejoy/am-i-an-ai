// Kafka Sample Data Population Script
// Populates MSK Serverless cluster with realistic match event data for Phase 1 testing

import { Kafka, KafkaConfig, Producer, Admin } from 'kafkajs';
import { KafkaClient, GetBootstrapBrokersCommand } from '@aws-sdk/client-kafka';
import { createSampleMatches, exportEventsForKafka } from '../kafka-sample-generator';

export interface PopulationConfig {
  matchCount: number;
  topicName: string;
  batchSize: number;
  retryAttempts: number;
  dryRun: boolean;
  onProgress?: (progress: ProgressUpdate) => void;
}

export interface PopulationResult {
  success: boolean;
  matchesGenerated: number;
  eventsGenerated: number;
  eventsPublished: number;
  duration: number;
  statistics: PopulationStatistics;
  error?: string;
  phase?: string;
}

export interface PopulationStatistics {
  avgEventsPerMatch: number;
  batchCount: number;
  avgBatchSize: number;
  totalRetries: number;
  publishingTime: number;
}

export interface ProgressUpdate {
  phase: 'connecting' | 'generating' | 'publishing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  details?: any;
}

export interface KafkaConnectionConfig {
  clusterArn: string;
  region: string;
}

export class KafkaPopulator {
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private admin: Admin | null = null;
  private connectionConfig: KafkaConnectionConfig;

  constructor(connectionConfig: KafkaConnectionConfig) {
    this.connectionConfig = connectionConfig;
  }

  /**
   * Validate population configuration
   */
  validateConfig(config: PopulationConfig): void {
    if (config.matchCount < 1 || config.matchCount > 100) {
      throw new Error('Match count must be between 1 and 100');
    }

    if (!config.topicName || config.topicName.trim().length === 0) {
      throw new Error('Topic name is required');
    }

    if (config.batchSize < 1 || config.batchSize > 1000) {
      throw new Error('Batch size must be between 1 and 1000');
    }

    if (config.retryAttempts < 0 || config.retryAttempts > 10) {
      throw new Error('Retry attempts must be between 0 and 10');
    }
  }

  /**
   * Get default configuration
   */
  getDefaults(): PopulationConfig {
    return {
      matchCount: 10,
      topicName: 'match-events',
      batchSize: 50,
      retryAttempts: 3,
      dryRun: false
    };
  }

  /**
   * Connect to MSK cluster
   */
  async connect(): Promise<void> {
    try {
      // Get MSK bootstrap brokers
      const mskClient = new KafkaClient({ region: this.connectionConfig.region });
      const command = new GetBootstrapBrokersCommand({
        ClusterArn: this.connectionConfig.clusterArn
      });
      const response = await mskClient.send(command);

      if (!response.BootstrapBrokerStringSaslIam) {
        throw new Error('No SASL/IAM bootstrap brokers found for MSK cluster');
      }

      // Configure Kafka client
      const kafkaConfig: KafkaConfig = {
        clientId: 'robot-orchestra-populator',
        brokers: response.BootstrapBrokerStringSaslIam.split(','),
        ssl: true,
        sasl: {
          mechanism: 'aws',
          authorizationIdentity: process.env.AWS_ROLE_ARN || '',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          sessionToken: process.env.AWS_SESSION_TOKEN
        },
        connectionTimeout: 10000,
        requestTimeout: 30000,
        retry: {
          initialRetryTime: 300,
          retries: 8
        }
      };

      this.kafka = new Kafka(kafkaConfig);
      this.producer = this.kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000
      });
      this.admin = this.kafka.admin();

      await Promise.all([
        this.producer.connect(),
        this.admin.connect()
      ]);

    } catch (error) {
      throw new Error(`Failed to connect to MSK cluster: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    const disconnectPromises: Promise<void>[] = [];
    
    if (this.producer) {
      disconnectPromises.push(this.producer.disconnect());
    }
    
    if (this.admin) {
      disconnectPromises.push(this.admin.disconnect());
    }

    await Promise.all(disconnectPromises);
  }

  /**
   * Ensure topic exists with proper configuration
   */
  async ensureTopicExists(topicName: string): Promise<void> {
    if (!this.admin) {
      throw new Error('Admin client not connected');
    }

    try {
      await this.admin.createTopics({
        topics: [{
          topic: topicName,
          numPartitions: 3, // Good for parallel processing
          replicationFactor: 2, // MSK Serverless default
          configEntries: [
            { name: 'retention.ms', value: '-1' }, // Infinite retention for event sourcing
            { name: 'cleanup.policy', value: 'compact,delete' },
            { name: 'compression.type', value: 'snappy' },
            { name: 'max.message.bytes', value: '1048576' } // 1MB max message size
          ]
        }]
      });
    } catch (error) {
      // Topic might already exist, which is fine
      if (!error || !String(error).includes('already exists')) {
        throw error;
      }
    }
  }

  /**
   * Publish events to Kafka in batches
   */
  async publishEvents(
    events: Array<{ topic: string; key: string; value: string; timestamp: number }>,
    batchSize: number
  ): Promise<{ successCount: number; errorCount: number; errors: Error[] }> {
    if (!this.producer) {
      throw new Error('Producer not connected');
    }

    const results = {
      successCount: 0,
      errorCount: 0,
      errors: [] as Error[]
    };

    // Process events in batches
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      
      try {
        await this.producer.send({
          topic: batch[0].topic,
          messages: batch.map(event => ({
            key: event.key,
            value: event.value,
            timestamp: event.timestamp.toString()
          }))
        });

        results.successCount += batch.length;
      } catch (error) {
        console.error(`Failed to publish batch ${Math.floor(i / batchSize) + 1}:`, error);
        results.errorCount += batch.length;
        results.errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    return results;
  }

  /**
   * Main population process
   */
  async populate(config: PopulationConfig): Promise<PopulationResult> {
    const startTime = Date.now();
    let phase = 'setup';
    
    try {
      this.validateConfig(config);

      const result: PopulationResult = {
        success: false,
        matchesGenerated: 0,
        eventsGenerated: 0,
        eventsPublished: 0,
        duration: 0,
        statistics: {
          avgEventsPerMatch: 0,
          batchCount: 0,
          avgBatchSize: 0,
          totalRetries: 0,
          publishingTime: 0
        }
      };

      // Report progress helper
      const reportProgress = (phase: ProgressUpdate['phase'], progress: number, message: string, details?: any) => {
        if (config.onProgress) {
          config.onProgress({ phase, progress, message, details });
        }
      };

      // Phase 1: Connect to Kafka
      phase = 'connection';
      reportProgress('connecting', 10, 'Connecting to MSK cluster...');
      
      if (!config.dryRun) {
        await this.connect();
        await this.ensureTopicExists(config.topicName);
      }

      reportProgress('connecting', 20, 'Connected successfully');

      // Phase 2: Generate sample data
      phase = 'generation';
      reportProgress('generating', 30, `Generating ${config.matchCount} sample matches...`);

      const sampleMatches = await createSampleMatches(config.matchCount);
      
      result.matchesGenerated = sampleMatches.length;
      result.eventsGenerated = sampleMatches.reduce((total, match) => total + match.events.length, 0);

      reportProgress('generating', 50, `Generated ${result.eventsGenerated} events from ${result.matchesGenerated} matches`);

      // Phase 3: Prepare events for publishing
      const allEvents: Array<{ topic: string; key: string; value: string; timestamp: number }> = [];
      
      for (const match of sampleMatches) {
        const kafkaEvents = exportEventsForKafka(match.events);
        allEvents.push(...kafkaEvents);
      }

      reportProgress('generating', 60, 'Events prepared for publishing');

      // Phase 4: Publish to Kafka (unless dry run)
      phase = 'publishing';
      const publishingStartTime = Date.now();

      if (config.dryRun) {
        reportProgress('publishing', 90, 'Dry run mode - skipping actual publishing');
        result.eventsPublished = 0;
      } else {
        reportProgress('publishing', 70, 'Publishing events to Kafka...');

        const publishResult = await this.publishEvents(allEvents, config.batchSize);
        
        result.eventsPublished = publishResult.successCount;
        
        if (publishResult.errorCount > 0) {
          console.warn(`${publishResult.errorCount} events failed to publish:`, publishResult.errors);
        }

        reportProgress('publishing', 90, `Published ${result.eventsPublished} events`);
      }

      const publishingTime = Date.now() - publishingStartTime;

      // Calculate statistics
      result.statistics = {
        avgEventsPerMatch: result.eventsGenerated / result.matchesGenerated,
        batchCount: Math.ceil(allEvents.length / config.batchSize),
        avgBatchSize: allEvents.length / Math.ceil(allEvents.length / config.batchSize),
        totalRetries: 0, // TODO: Track retries
        publishingTime
      };

      // Phase 5: Complete
      phase = 'complete';
      result.duration = Date.now() - startTime;
      result.success = true;

      reportProgress('complete', 100, 'Population completed successfully', {
        matchesGenerated: result.matchesGenerated,
        eventsGenerated: result.eventsGenerated,
        eventsPublished: result.eventsPublished,
        duration: result.duration
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (config.onProgress) {
        config.onProgress({
          phase: 'error',
          progress: 0,
          message: `Error during ${phase}: ${errorMessage}`
        });
      }

      return {
        success: false,
        matchesGenerated: 0,
        eventsGenerated: 0,
        eventsPublished: 0,
        duration: Date.now() - startTime,
        statistics: {
          avgEventsPerMatch: 0,
          batchCount: 0,
          avgBatchSize: 0,
          totalRetries: 0,
          publishingTime: 0
        },
        error: errorMessage,
        phase
      };
    } finally {
      if (!config.dryRun && this.kafka) {
        try {
          await this.disconnect();
        } catch (error) {
          console.warn('Error disconnecting from Kafka:', error);
        }
      }
    }
  }
}

/**
 * CLI Interface - can be run directly with node
 */
export async function runCLI() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const config: Partial<PopulationConfig> = {};
  let clusterArn = '';
  let region = 'us-east-1';

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--count':
        config.matchCount = parseInt(value, 10);
        break;
      case '--topic':
        config.topicName = value;
        break;
      case '--batch-size':
        config.batchSize = parseInt(value, 10);
        break;
      case '--dry-run':
        config.dryRun = true;
        i--; // No value for this flag
        break;
      case '--cluster-arn':
        clusterArn = value;
        break;
      case '--region':
        region = value;
        break;
      case '--help':
        printUsage();
        process.exit(0);
        break;
    }
  }

  if (!clusterArn) {
    console.error('❌ Error: --cluster-arn is required');
    printUsage();
    process.exit(1);
  }

  try {
    const populator = new KafkaPopulator({ clusterArn, region });
    const fullConfig: PopulationConfig = {
      ...populator.getDefaults(),
      ...config,
      onProgress: (progress) => {
        console.log(`[${progress.phase.toUpperCase()}] ${progress.progress}% - ${progress.message}`);
      }
    };

    console.log('🚀 Starting Kafka sample data population...');
    console.log('📊 Configuration:', {
      matchCount: fullConfig.matchCount,
      topicName: fullConfig.topicName,
      batchSize: fullConfig.batchSize,
      dryRun: fullConfig.dryRun
    });

    const result = await populator.populate(fullConfig);

    if (result.success) {
      console.log('\n✅ Population completed successfully!');
      console.log(`📈 Generated ${result.matchesGenerated} matches with ${result.eventsGenerated} events`);
      console.log(`📤 Published ${result.eventsPublished} events to Kafka`);
      console.log(`⏱️  Duration: ${result.duration}ms`);
      console.log('📊 Statistics:', result.statistics);
    } else {
      console.error('\n❌ Population failed:', result.error);
      console.error(`💥 Failed during phase: ${result.phase}`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

function printUsage() {
  console.log(`
Usage: node populate-kafka-samples.js --cluster-arn <arn> [options]

Required:
  --cluster-arn <arn>     MSK Serverless cluster ARN

Options:
  --count <number>        Number of matches to generate (default: 10)
  --topic <name>          Topic name (default: match-events)
  --batch-size <number>   Batch size for publishing (default: 50)
  --region <region>       AWS region (default: us-east-1)
  --dry-run              Generate data but don't publish to Kafka
  --help                 Show this help message

Examples:
  node populate-kafka-samples.js --cluster-arn arn:aws:kafka:us-east-1:123:cluster/test --count 20
  node populate-kafka-samples.js --cluster-arn arn:aws:kafka:us-east-1:123:cluster/test --dry-run
`);
}

// Run CLI if this script is executed directly
if (require.main === module) {
  runCLI().catch(console.error);
}