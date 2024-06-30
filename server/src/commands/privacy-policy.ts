import type { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

import { GalaxyInfoCommand } from "../GalaxyInfoCommand";

const PP = (configSite: string) =>
  `You can find the privacy policy of Galaxy Info at ${configSite}/privacy-policy`;

export class PrivacyPolicyCommand extends GalaxyInfoCommand {
  private readonly pp: string;

  constructor(GalaxyInfo: GalaxyInfo) {
    const builder = new SlashCommandBuilder()
      .setName("privacy-policy")
      .setDescription("See the privacy policy of Galaxy Info");
    super({ builder, instant: true });

    this.pp = PP(GalaxyInfo.config.web.frontendBase);
  }

  public async interactionCreate(
    interaction: CommandInteraction,
    ephemeral: boolean
  ) {
    await interaction.reply({ ephemeral, content: this.pp });
  }
}
