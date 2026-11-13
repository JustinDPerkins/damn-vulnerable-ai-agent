/** Sign data with an Ed25519 secret key */
export declare function sign(data: Uint8Array, secretKey: Uint8Array): Uint8Array;
/** Verify an Ed25519 detached signature. Accepts publicKey as Uint8Array or base64 string. */
export declare function verify(data: Uint8Array, signature: Uint8Array, publicKey: Uint8Array | string): boolean;
//# sourceMappingURL=crypto.d.ts.map