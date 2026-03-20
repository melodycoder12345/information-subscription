declare module 'libsodium-wrappers' {
  export interface Base64Variants {
    ORIGINAL: number;
  }

  export interface Sodium {
    ready: Promise<void>;
    base64_variants: Base64Variants;
    from_base64: (data: string, variant: number) => Uint8Array;
    to_base64: (data: Uint8Array, variant: number) => string;
    crypto_box_seal: (message: string, publicKey: Uint8Array) => Uint8Array;
  }

  const sodium: Sodium;
  export default sodium;
}
