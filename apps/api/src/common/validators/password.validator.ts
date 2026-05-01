import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  maxRepeatedChars: 3,
};

export function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_POLICY.minLength} characters`,
    );
  }
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(
      `Password must not exceed ${PASSWORD_POLICY.maxLength} characters`,
    );
  }
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (PASSWORD_POLICY.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (
    PASSWORD_POLICY.requireSpecialChar &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    errors.push('Password must contain at least one special character');
  }
  if (/(.)\1{3,}/.test(password)) {
    errors.push('Password must not contain more than 3 repeated characters');
  }

  return errors;
}

export function PasswordComplexity(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'passwordComplexity',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string): boolean {
          return validatePassword(value).length === 0;
        },
        defaultMessage(args: ValidationArguments): string {
          const errors = validatePassword(args.value);
          return errors.length > 0 ? errors.join('. ') : '';
        },
      },
    });
  };
}
