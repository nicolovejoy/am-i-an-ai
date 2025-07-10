// Test the shuffle function
function seededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return function() {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}

function shuffleArray(array, seed) {
  const random = seededRandom(seed);
  const shuffled = [...array];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// Test
const identities = ['A', 'B', 'C', 'D'];
const seed = 'match-123-round-1';
const result = shuffleArray(identities, seed);

console.log('Input:', identities);
console.log('Seed:', seed);
console.log('Output:', result);
console.log('Output length:', result.length);

// Test multiple times with same seed
console.log('\nTesting consistency:');
for (let i = 0; i < 3; i++) {
  console.log(`Run ${i + 1}:`, shuffleArray(['A', 'B', 'C', 'D'], seed));
}