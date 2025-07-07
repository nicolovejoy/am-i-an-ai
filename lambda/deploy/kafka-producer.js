"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaProducer = void 0;
const kafkajs_1 = require("kafkajs");
const schemas_1 = require("./kafka-schemas/schemas");
class KafkaProducer {
    constructor(config) {
        this.connected = false;
        // Let's try the official aws-msk-iam-sasl-signer-js package with correct import
        let saslConfig;
        try {
            // Import and use the AWS MSK IAM signer
            const { awsIamAuthenticator } = require('aws-msk-iam-sasl-signer-js');
            saslConfig = awsIamAuthenticator({
                region: process.env.AWS_REGION || 'us-east-1',
                ttl: 900000, // 15 minutes
            });
            console.log('Using aws-msk-iam-sasl-signer-js authentication');
        }
        catch (error) {
            console.error('Failed to load aws-msk-iam-sasl-signer-js:', error);
            // Fallback: try without authentication for testing
            saslConfig = undefined;
            console.log('Falling back to no authentication');
        }
        this.kafka = new kafkajs_1.Kafka({
            clientId: config.clientId,
            brokers: config.brokers,
            ssl: true,
            sasl: saslConfig,
        });
        this.producer = this.kafka.producer();
    }
    async connect() {
        if (!this.connected) {
            try {
                await this.producer.connect();
                this.connected = true;
                console.log('Kafka producer connected successfully');
            }
            catch (error) {
                console.error('Kafka connection error:', error);
                // Don't throw - let the Lambda continue
            }
        }
    }
    async disconnect() {
        if (this.connected) {
            await this.producer.disconnect();
            this.connected = false;
            console.log('Kafka producer disconnected');
        }
    }
    async send(topic, eventType, matchId, data) {
        if (!this.connected) {
            await this.connect();
        }
        if (!this.connected) {
            console.log('Kafka not connected - skipping event publish');
            return;
        }
        const event = {
            eventId: (0, schemas_1.createEventId)(),
            eventType,
            matchId,
            timestamp: Date.now(),
            data,
        };
        const record = {
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
        }
        catch (error) {
            console.error('Failed to send event to Kafka:', error);
            // Don't throw - let the Lambda continue
        }
    }
}
exports.KafkaProducer = KafkaProducer;
