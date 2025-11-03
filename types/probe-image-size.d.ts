declare module "probe-image-size" {
  interface Result {
    width: number;
    height: number;
    type?: string;
    mime?: string;
    orientation?: number;
    length?: number;
  }

  function probe(input: string | Buffer | URL): Promise<Result>;

  export = probe;
}
