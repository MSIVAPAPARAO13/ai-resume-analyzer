export interface DocumentParser {
  parse(buffer: Buffer): Promise<string>;
}
