import { writeFile } from 'fs/promises'

type LogFunction = (...message: any[]) => void
type Arg = {
  GalaxyInfo: GalaxyInfo
  log: LogFunction
}

export async function run ({ GalaxyInfo, log: logParent }: Arg) {
  const log = (...message: any[]) => logParent('[Help]', ...message)

  const commands = GalaxyInfo.client.stores.get('commands') as any
  await commands.loadAll()

  const output: any = {}

  for (const command of commands.values()) {
    const category = command.fullCategory.join('/')
    // if (category.startsWith('_')) continue
    if (command.enabled === false) continue

    if (!output[category]) output[category] = []

    console.log(command)

    output[category].push({
      name: command.name,
      aliases: command.aliases,
      description: command.description,
      detailedDescription: command.detailedDescription,
      examples: command.examples ?? [],
      flags: command.strategy.flags ?? []
    })
  }

  await writeFile('web-client/src/help.json', JSON.stringify(output, null, 2))

  log('Wrote help.json')
}
