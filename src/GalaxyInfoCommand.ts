import { Command } from '@sapphire/framework'
import type { PieceContext } from '@sapphire/pieces'

export abstract class GalaxyInfoCommand extends Command {
  public examples: string[];

  public constructor (context: PieceContext, options: GalaxyInfoCommand.Options) {
    options.quotes = options.quotes ?? [
      ['"', '"'], // Double quotes
      ['“', '”'], // Fancy quotes (on iOS)
      ['「', '」'], // Corner brackets (CJK)
      ['„', '“'] // German
    ]
    super(context, options)
    this.examples = options.examples ?? []
  }
}
