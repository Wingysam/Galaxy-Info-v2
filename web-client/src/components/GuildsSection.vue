<template>
  <v-container>
    <v-row
      v-if="guilds.length"
      justify="start"
    >
      <v-col
        v-for="guild in guilds"
        :key="guild.id"
        style="flex-grow: 0;"
      >
        <v-card
          height="13.5em"
          width="9em"
          style="overflow: hidden;"
          @click="invite ? redirect(generateInvite(guild)) : $router.push(`/guilds/${guild.id}/general`)"
        >
          <v-img
            :src="guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp` : require('@/assets/discord.svg')"
            contain
            class="shrink"
            width="9em"
            height="9em"
          />
          <p
            class="mx-4 my-4"
            style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
          >
            {{ guild.name }}
          </p>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col style="flex-grow: 0;">
        <v-card
          height="13.5em"
          width="9em"
          loading
        >
          <v-skeleton-loader
            width="9em"
            height="9em"
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
    guilds: {
      type: Array,
      default: undefined
    },
    invite: {
      type: String,
      default: undefined
    }
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
