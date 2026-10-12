// Type-checking shim for running `tsc` on Edge Functions from Node. Not deployed.
declare namespace Deno {
  const env: { get(key: string): string | undefined }
  function serve(handler: (req: Request) => Response | Promise<Response>): void
}
