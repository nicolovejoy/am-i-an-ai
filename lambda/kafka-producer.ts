import { Kafka, Producer, ProducerRecord } from 'kafkajs';
import { MatchEvent, createEventId } from './kafka-schemas/schemas';

export class KafkaProducer {
  private kafka: Kafka;
  private producer: Producer;
  private connected: boolean = false;

  constructor(config: { brokers: string[]; clientId: string }) {
    // Let's try the official aws-msk-iam-sasl-signer-js package with correct import
    let saslConfig: any;
    
    try {
      // Import and use the AWS MSK IAM signer
      const { awsIamAuthenticator } = require('aws-msk-iam-sasl-signer-js');
      
      saslConfig = awsIamAuthenticator({
        region: process.env.AWS_REGION || 'us-east-1',
        ttl: 900000, // 15 minutes
      });
      
      console.log('Using aws-msk-iam-sasl-signer-js authentication');
    } catch (error) {
      console.error('Failed to load aws-msk-iam-sasl-signer-js:', error);
      
      // Fallback: try without authentication for testing
      saslConfig = undefined;
      console.log('Falling back to no authentication');
    }
    
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      ssl: true,
      sasl: saslConfig,
    });
    
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      try {
        await this.producer.connect();
        this.connected = true;
        console.log('Kafka producer connected successfully');
      } catch (error) {
        console.error('Kafka connection error:', error);
        // Don't throw - let the Lambda continue
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.producer.disconnect();
      this.connected = false;
      console.log('Kafka producer disconnected');
    }
  }

  async send(topic: string, eventType: string, matchId: string, data: any): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    if (!this.connected) {
      console.log('Kafka not connected - skipping event publish');
      return;
    }

    const event: MatchEvent = {
      eventId: createEventId(),
      eventType,
      matchId,
      timestamp: Date.now(),
      data,
    };

    const record: ProducerRecord = {
      topic,
      messages: [
        {
          key: matchId,
          value: JSON.stringify(event),
          timestamp: Date.now().toString(),
        },
      ],
    };

    try {
      await this.producer.send(record);
      console.log(`Event published to ${topic}:`, eventType);
    } catch (error) {
      console.error('Failed to send event to Kafka:', error);
      // Don't throw - let the Lambda continue
    }
  }
}