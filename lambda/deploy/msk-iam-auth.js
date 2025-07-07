"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIamAuthenticator = createIamAuthenticator;
const signature_v4_1 = require("@aws-sdk/signature-v4");
const sha256_js_1 = require("@aws-crypto/sha256-js");
const credential_providers_1 = require("@aws-sdk/credential-providers");
/**
 * Creates a SASL authenticator for AWS MSK IAM authentication
 * This manually implements the AWS IAM authentication protocol for Kafka
 */
function createIamAuthenticator(region) {
    return {
        mechanism: 'AWS_MSK_IAM',
        authenticationProvider: () => {
            return {
                authenticate: async () => {
                    const credentials = await (0, credential_providers_1.fromNodeProviderChain)()();
                    // Create the authentication payload
                    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
                    const payload = {
                        version: '2020_10_22',
                        'aws-service': 'kafka-cluster',
                        'aws-region': region,
                        'aws-timestamp': timestamp,
                    };
                    // Sign the request
                    const signer = new signature_v4_1.SignatureV4({
                        credentials,
                        region,
                        service: 'kafka-cluster',
                        sha256: sha256_js_1.Sha256,
                    });
                    const request = {
                        method: 'GET',
                        protocol: 'https:',
                        hostname: 'kafka.' + region + '.amazonaws.com',
                        path: '/',
                        headers: {
                            host: 'kafka.' + region + '.amazonaws.com',
                        },
                        query: payload,
                    };
                    const signed = await signer.sign(request);
                    // Extract the authentication data
                    const authData = {
                        accessKeyId: credentials.accessKeyId,
                        secretAccessKey: credentials.secretAccessKey,
                        sessionToken: credentials.sessionToken,
                        signature: signed.headers.authorization,
                    };
                    return {
                        accessKeyId: credentials.accessKeyId,
                        secretAccessKey: credentials.secretAccessKey,
                        sessionToken: credentials.sessionToken,
                    };
                },
            };
        },
    };
}
