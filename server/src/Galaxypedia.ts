import Nodemw from 'nodemw'

export class Galaxypedia extends Nodemw {
  constructor() {
    super({
      server: 'robloxgalaxy.wiki'
    })
  }

  getImageInfo (filename: string): Promise<any> {
      return new Promise((resolve, reject) => {
        super.getImageInfo(filename, (err: Error | undefined, output: any) => {
          if (err) return reject(err)
          resolve(output)
        })
      })
  }
}