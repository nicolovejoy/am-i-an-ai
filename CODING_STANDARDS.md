# Coding Standards: Functional Programming Approach

## Core Principles

Our project follows a functional programming (FP) approach with these core principles:

1. **Immutability**: Data should never be modified once created
2. **Pure Functions**: Functions should have no side effects and always return the same output for the same input
3. **Function Composition**: Complex operations should be built by composing simpler functions
4. **First-Class Functions**: Functions should be treated as first-class citizens (passed as arguments, returned, etc.)
5. **No Shared State**: Avoid shared mutable state and favor explicit state passing
6. **No Classes**: Use functions and pure data structures instead of classes and methods

## Specific Patterns and Practices

### Data Modeling

- Use TypeScript interfaces to define data structures
- Use readonly types for immutability (`readonly`, `ReadonlyArray<T>`, etc.)
- Define entities using dynamodb-toolbox Entity pattern

```typescript
// Good
export interface IUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  // ...
}

// Good
export const User = new Entity({
  name: "User",
  attributes: {
    // ...
  },
});

// Avoid
export class User {
  private id: string;
  constructor(data: Partial<IUser>) {
    // ...
  }

  save() {
    // ...
  }
}
```

### Functions and Operations

- Export named functions rather than classes with methods
- Use pure functions that don't modify their inputs
- Pass complete objects rather than multiple parameters
- Use function composition for complex operations

```typescript
// Good
export async function findById(id: string): Promise<IUser | null> {
  // ...
}

// Good
export async function updateUser(
  id: string,
  updates: Partial<IUser>
): Promise<IUser> {
  // Get current user without modifying it
  const existingUser = await findById(id);

  // Create new object with updates
  const updatedFields = {
    ...updates,
    updatedAt: new Date(),
  };

  // ...
}

// Avoid
class UserRepository {
  async findById(id: string) {
    // ...
  }

  async updateUser(id, updates) {
    // ...
  }
}
```

### State Management

- Avoid global mutable state
- Pass state explicitly between functions
- Use immutable data structures
- When state must be stored, use functional state patterns

```typescript
// Good
export function processUsers(
  users: readonly IUser[],
  processFn: (user: IUser) => IUser
): readonly IUser[] {
  return users.map(processFn);
}

// Avoid
let users = [];
function processUsers(processFn) {
  users = users.map(processFn);
}
```

### Error Handling

- Use Result/Either patterns instead of throwing exceptions
- Handle errors at the boundaries of the application
- Make errors part of the function signature

```typescript
// Good
export async function findById(id: string): Promise<IUser | null> {
  try {
    // ...
    return user;
  } catch (error) {
    // Log error
    return null;
  }
}

// Controllers can handle application errors
export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await userRepository.findById(req.params.id);
    if (!user) {
      throw new ApplicationError("User not found", 404);
    }
    // ...
  } catch (error) {
    next(error);
  }
};
```

## Tools and Enforcement

The following tools enforce our functional programming approach:

1. **ESLint with eslint-plugin-functional**: Enforces FP patterns
2. **TypeScript with strict mode**: Ensures type safety and immutability
3. **Husky and lint-staged**: Validates code before commits
4. **CI Pipeline**: Verifies code adheres to standards

## Common Anti-patterns to Avoid

- ❌ Using classes with methods and instance properties
- ❌ Using `this` keyword
- ❌ Modifying function parameters
- ❌ Using mutable variables (`let`)
- ❌ Using loops (prefer map, filter, reduce)
- ❌ Throwing exceptions in business logic
- ❌ Global or module-level mutable state

## Exceptions and Practical Considerations

While we strive for pure functional programming, some exceptions are practical:

- React components use hooks which rely on local state
- Express middleware uses side effects for HTTP responses
- Certain third-party libraries may require non-functional patterns

When exceptions are necessary, contain them in boundary layers and document the reason.
