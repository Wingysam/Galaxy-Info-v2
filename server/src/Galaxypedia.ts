import fetch from 'node-fetch'

export class Galaxypedia {
  async getImageInfo(filename: string): Promise<any> {
    const exts = ['webp', 'png', 'jpg', 'jpeg'] as const
    let lastError: Error | null = null

    const getFileWithExt = async (ext: (typeof exts)[number]) => {
      const url = `https://wiki.galaxy.casa/w/api.php?action=query&titles=File:${filename}.${ext}&prop=imageinfo&iiprop=url&format=json`
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Galaxy-Info',
        },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const pages = data.query.pages
      const pageId = Object.keys(pages)[0]
      const page = pages[pageId]
      if (page.missing) throw new Error('File not found')
      if (!page.imageinfo?.[0]) {
        throw new Error('No image info')
      }
      return { url: page.imageinfo[0].url }
    }

    for (const ext of exts) {
      try {
        const info = await getFileWithExt(ext)
        return info
      } catch (err) {
        lastError = err as Error
      }
    }

    throw new Error(
      `Could not fetch file "${filename}" from the Galaxypedia with any of these extensions: [${exts.join(', ')}]: ${lastError?.message}`,
    )
  }

  async getShipImage(ship: string): Promise<string | null> {
    try {
      const info = await this.getImageInfo(`${ship}-icon`)
      if (!info) return null
      return info.url || null
    } catch {
      return null
    }
  }
}
