// Quick test to verify sample generator compiles
const { generateCompleteMatch } = require('./kafka-sample-generator.ts');

async function testGenerator() {
  try {
    console.log('Testing sample generator...');
    const events = await generateCompleteMatch('test_match_001');
    console.log(`Generated ${events.length} events for complete match`);
    console.log('First event:', events[0].eventType);
    console.log('Last event:', events[events.length - 1].eventType);
    console.log('Sample generator working!');
  } catch (error) {
    console.error('Generator error:', error);
  }
}

testGenerator();