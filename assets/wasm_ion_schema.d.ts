/* tslint:disable */
/* eslint-disable */
/**
* @param {string} ion
* @param {string} schema
* @param {string} schema_type
* @returns {SchemaValidationResult}
*/
export function validate(ion: string, schema: string, schema_type: string): SchemaValidationResult;
/**
*/
export class SchemaValidationResult {
  free(): void;
/**
* @param {boolean} r
* @param {string} v
* @param {string} val
* @param {boolean} has_error
* @param {string} error
*/
  constructor(r: boolean, v: string, val: string, has_error: boolean, error: string);
/**
* @returns {boolean}
*/
  result(): boolean;
/**
* @param {boolean} val
*/
  set_result(val: boolean): void;
/**
* @returns {string}
*/
  violation(): string;
/**
* @param {string} val
*/
  set_violation(val: string): void;
/**
* @returns {string}
*/
  value(): string;
/**
* @param {string} val
*/
  set_value(val: string): void;
/**
* @returns {string}
*/
  error(): string;
/**
* @param {string} val
*/
  set_error(val: string): void;
/**
* @returns {boolean}
*/
  has_error(): boolean;
/**
* @param {boolean} val
*/
  set_has_error(val: boolean): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_schemavalidationresult_free: (a: number) => void;
  readonly schemavalidationresult_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly schemavalidationresult_result: (a: number) => number;
  readonly schemavalidationresult_set_result: (a: number, b: number) => void;
  readonly schemavalidationresult_violation: (a: number, b: number) => void;
  readonly schemavalidationresult_set_violation: (a: number, b: number, c: number) => void;
  readonly schemavalidationresult_value: (a: number, b: number) => void;
  readonly schemavalidationresult_set_value: (a: number, b: number, c: number) => void;
  readonly schemavalidationresult_error: (a: number, b: number) => void;
  readonly schemavalidationresult_set_error: (a: number, b: number, c: number) => void;
  readonly schemavalidationresult_has_error: (a: number) => number;
  readonly schemavalidationresult_set_has_error: (a: number, b: number) => void;
  readonly validate: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number) => void;
}

/**
* Synchronously compiles the given `bytes` and instantiates the WebAssembly module.
*
* @param {BufferSource} bytes
*
* @returns {InitOutput}
*/
export function initSync(bytes: BufferSource): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
