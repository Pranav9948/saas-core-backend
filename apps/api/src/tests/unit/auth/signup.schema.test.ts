import { SignupSchema } from '@/modules/auth/auth.schema.js';

describe('SignupSchema Validation', () => {
  it('should pass with valid data', () => {
    const validData = {
      body: {
        email: 'john@example.com',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      },
    };

    const result = SignupSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });
});
