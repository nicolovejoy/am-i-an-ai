# Interactive Agent Portal Backend

The backend for the Interactive Agent Portal, handling conversations, user management, agent interactions, and data persistence.

## DynamoDB Setup

### Local Development Setup

1. Start the local DynamoDB and admin interface:

   ```bash
   npm run docker:up
   ```

   This will start:

   - DynamoDB Local at http://localhost:8000
   - DynamoDB Admin UI at http://localhost:8001

2. Initialize the tables:

   ```bash
   npm run db:init
   ```

3. Stop the containers when done:
   ```bash
   npm run docker:down
   ```

### Configuration

The application uses the following environment variables for DynamoDB configuration:

```
AWS_REGION=us-east-1
DYNAMODB_ENDPOINT=http://localhost:8000     # For local development only
AWS_ACCESS_KEY_ID=localkey                  # For local development only
AWS_SECRET_ACCESS_KEY=localsecret          # For local development only

# Table names (optional, defaults are provided)
DYNAMODB_USER_TABLE=amianai-users
DYNAMODB_CONVERSATION_TABLE=amianai-conversations
DYNAMODB_ANALYSIS_TABLE=amianai-analyses
```

### Production Deployment

For production, the tables are managed through Terraform. To deploy changes to the database structure:

1. Update the table definitions in `infrastructure/main.tf`
2. Deploy using the infrastructure setup script:
   ```bash
   cd infrastructure
   ./scripts/setup.sh
   ```

### Data Model

The application uses a single-table design with the following patterns:

#### User Table

- Primary Key: `pk=USER#<userId>`, `sk=PROFILE`
- GSI: EmailIndex - Key: `email`

#### Conversation Table

- Primary Key: `pk=USER#<userId>`, `sk=CONVERSATION#<conversationId>`
- GSI: LastMessageIndex - Keys: `pk` (hash), `lastMessageAt` (range)

#### Analysis Table

- Primary Key: `pk=USER#<userId>`, `sk=ANALYSIS#<analysisId>`
- GSI: CreatedAtIndex - Keys: `pk` (hash), `createdAt` (range)

## Testing Strategy

### Repository Tests

The repositories should have comprehensive tests to verify data access patterns:

1. **User Repository Tests**

   - User creation, retrieval, update, and deletion
   - Email-based lookup
   - Authentication-related operations

2. **Conversation Repository Tests**

   - Creating and retrieving conversations
   - Adding messages to existing conversations
   - Querying conversations by last activity

3. **Interaction Repository Tests**
   - Creating interactions between users and agents
   - Updating interaction state and trust scores
   - Retrieving interaction history by user or agent

### API Endpoint Tests

We'll implement endpoint tests using SuperTest to verify our REST API:

1. **Authentication Endpoints**

   - Registration flow
   - Login/token generation
   - Token validation

2. **User Endpoints**

   - Profile management
   - User preferences

3. **Conversation Endpoints**

   - Creating new conversations
   - Message handling
   - Conversation history retrieval

4. **Agent Interaction Endpoints**
   - Initiating agent interactions
   - Message exchange validation
   - Trust scoring and feedback

### Running Tests

To run the tests locally:

```bash
# Install development dependencies
npm install

# Make sure DynamoDB local is running
npm run docker:up

# Run the tests
npm test
```

### Test Environment

Tests will use:

- DynamoDB local for database testing
- In-memory JWT validation
- Isolated test environment variables
