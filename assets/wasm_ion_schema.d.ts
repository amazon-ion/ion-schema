/* tslint:disable */
/* eslint-disable */
/**
* @param {string} ion
* @param {string} schema
* @param {string} schema_type
* @param {boolean} is_document
* @returns {SchemaValidationResult}
*/
export function validate(ion: string, schema: string, schema_type: string, is_document: boolean): SchemaValidationResult;
/**
*/
export class SchemaValidationResult {
  free(): void;
/**
* @param {boolean} r
* @param {Array<any>} v
* @param {string} val
* @param {boolean} has_error
* @param {string} error
*/
  constructor(r: boolean, v: Array<any>, val: string, has_error: boolean, error: string);
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
/**
* @returns {Array<any>}
*/
  violations(): Array<any>;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_schemavalidationresult_free: (a: number) => void;
  readonly schemavalidationresult_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly schemavalidationresult_result: (a: number) => number;
  readonly schemavalidationresult_set_result: (a: number, b: number) => void;
  readonly schemavalidationresult_value: (a: number, b: number) => void;
  readonly schemavalidationresult_set_value: (a: number, b: number, c: number) => void;
  readonly schemavalidationresult_error: (a: number, b: number) => void;
  readonly schemavalidationresult_set_error: (a: number, b: number, c: number) => void;
  readonly schemavalidationresult_has_error: (a: number) => number;
  readonly schemavalidationresult_set_has_error: (a: number, b: number) => void;
  readonly schemavalidationresult_violations: (a: number) => number;
  readonly validate: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
