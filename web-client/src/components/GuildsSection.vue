<template>
  <v-container>
    <v-row justify="start" v-if="guilds.length">
      <v-col v-for="guild in guilds" :key="guild.id" style="flex-grow: 0;">
        <v-card height="13.5em" width="10em" style="overflow: hidden;" @click="invite ? redirect(generateInvite(guild)) : $router.push(`/guilds/${guild.id}`)">
          <v-img
            :src="guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp` : require('@/assets/discord.svg')"
            contain
            class="shrink"
            height="10em"
          />
          <p class="mx-4 my-4" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ guild.name }}</p>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col style="flex-grow: 0;">
        <v-card height="13.5em" width="10em" loading>
          <v-skeleton-loader
            width="10em"
            height="10em"
            type="image"
          />
          <v-skeleton-loader
            class="mx-4 my-4"
            width="150%"
            type="heading"
          />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'GuildsSection',
  props: {
    guilds: Array,
    invite: String
  },
  methods: {
    generateInvite (guild) {
      return `${this.invite}&guild_id=${guild.id}`
    },
    redirect (url) {
      window.open(url, '_blank')
    }
  }
}
</script>
