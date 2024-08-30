import Nodemw from 'nodemw'

export class Galaxypedia extends Nodemw {
  constructor () {
    super({
      server: 'galaxypedia.org'
    })
  }

  async getImageInfo (filename: string): Promise<any> {
    return await new Promise((resolve, reject) => {
      super.getImageInfo(filename, (err: Error | undefined, output: any) => {
        if (err) { reject(err); return }
        resolve(output)
      })
    })
  }
}
