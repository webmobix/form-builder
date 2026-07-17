import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import type { JsonSchema } from './types';

export interface FieldError {
  /** JSON Pointer to the offending field, e.g. "/personal/email" */
  path: string;
  message: string;
}

export class FormValidator {
  private ajv: Ajv;
  private validateFn: ReturnType<Ajv['compile']>;

  constructor(dataSchema: JsonSchema) {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
    this.validateFn = this.ajv.compile(dataSchema);
  }

  validate(data: unknown): FieldError[] {
    const valid = this.validateFn(data);
    if (valid) return [];
    return (this.validateFn.errors ?? []).map(toFieldError);
  }
}

function toFieldError(err: ErrorObject): FieldError {
  if (err.keyword === 'required') {
    const missing = (err.params as { missingProperty?: string }).missingProperty;
    const path = `${err.instancePath}/${missing}`;
    return { path, message: `${missing} is required` };
  }
  return { path: err.instancePath, message: err.message ?? 'Invalid value' };
}
