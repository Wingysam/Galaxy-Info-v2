<template>
  <v-container>
    <div>
      <v-row justify="center">
        <v-col v-for="guild in guilds" :key="guild.id" style="flex-grow: 0;">
          <v-card height="15em" width="10em" style="overflow: hidden;" @click="$router.push(`/guilds/${guild.id}`)">
            <v-img
              :src="guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp` : require('@/assets/discord.svg')"
              contain
              class="shrink"
              height="10em"
            />
            <p class="mx-4 my-4">{{guild.name}}</p>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script>
import { BitField } from '@/util/BitField.js'

export default {
  name: 'Guilds',
  data () {
    return {
      guilds: []
    }
  },
  mounted () {
    (async () => {
      const discordUser = this.$store.state.discordUser || await this.$store.state.fetchDiscordUser()
      if (!discordUser) return console.log(discordUser)
      const guilds = await (await fetch('https://discord.com/api/v9/users/@me/guilds', {
        headers: {
          Authorization: 'Bearer ' + this.$store.state.discordToken
        }
      })).json()

      if (guilds.errors) {
        console.log('errors fetching guilds', guilds)
        return this.$store.commit('setToken', null)
      }
      this.guilds = guilds.filter(guild => {
        const bitfield = new BitField(guild.permissions)
        console.log(bitfield)
        return bitfield.has(8) || bitfield.has(5)
      })
    })()
  }
}
</script>