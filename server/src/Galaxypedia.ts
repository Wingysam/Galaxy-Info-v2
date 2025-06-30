import Nodemw from "nodemw";

export class Galaxypedia extends Nodemw {
  constructor() {
    super({
      server: "wiki.galaxy.casa",
    });
  }

  async getImageInfo(filename: string): Promise<any> {
    const exts = ["webp", "png", "jpg", "jpeg"] as const;
    let lastError: Error | null = null;

    const getFileWithExt = async (ext: (typeof exts)[number]) =>
      new Promise((resolve, reject) => {
        super.getImageInfo(
          `File:${filename}.${ext}`,
          (err: Error | undefined, output: any) => {
            if (err) reject(err);
            else resolve(output);
          },
        );
      });

    for (const ext of exts) {
      try {
        const info = await getFileWithExt(ext);
        return info;
      } catch (err) {
        lastError = err as Error;
      }
    }

    throw new Error(
      `Could not fetch file "${filename}" from the Galaxypedia with any of these extensions: [${exts.join(
        ", ",
      )}]: ${lastError?.message}`,
    );
  }

  async getShipImage(ship: string): Promise<string | null> {
    try {
      const info = await this.getImageInfo(`${ship}-icon`);
      if (!info) return null;
      return info.url || null;
    } catch {
      return null;
    }
  }
}
