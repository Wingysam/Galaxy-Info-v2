import { Command } from '@sapphire/framework'
import type { PieceContext } from '@sapphire/pieces'

export abstract class GalaxyInfoCommand extends Command {
  public examples: string[];

  public constructor (context: PieceContext, options: GalaxyInfoCommand.Options) {
    super(context, options)
    this.examples = options.examples ?? []
  }
}
