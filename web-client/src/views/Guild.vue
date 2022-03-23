<template>
  <div>
    <v-btn
      class="ma-4"
      :loading="!guild.loaded"
      @click="reloadData"
    >Refresh</v-btn>
    <div v-if="error" class="ma-8">
      <p style="color: red;">{{ error }}</p>
      <p>An error occured, please contact Wingy#3538 on Discord or reload the page.</p>
    </div>
    <GuildNav :guild="guild" v-else>
      <div class="mr-4">
        <div v-if="forceRequired" class="mb-4">
          <p><v-icon>mdi-alert</v-icon> The configuration was updated while you were editing. Overwrite changes?</p>
          <v-btn
            color="red"
            :loading="saving"
            @click="save(true)"
          >
            <span class="mr-2">Save anyway</span>
          </v-btn>
        </div>
        <v-btn
          color="primary"
          class="mb-4"
          @click="save()" 
          :loading="saving"
          v-else
        >
          <span class="mr-2">Save</span>
          <v-icon>mdi-floppy</v-icon>
        </v-btn>
        <pre class="mb-4 d-none"><code style="display: block; overflow-x: scroll;">{{JSON.stringify(guild, (key, value) => typeof value === "bigint" ? value.toString() + "n" : value, 2)}}</code></pre>
        <div v-if="section === 'general'">
          <h2 class="display-1 font-weight-bold mb-3">General</h2>
          <v-text-field label="Prefix" v-model="guild.config.prefix" style="width: 5em;"/>
        </div>
        <div v-else-if="section === 'commands'">
          <h2 class="display-1 font-weight-bold mb-3">Commands</h2>
          <v-card class="pa-4">
          <h3 class="display-1 font-weight-light mb-2">{{ guild.config.prefix }}ship</h3>
          <v-switch v-model="guild.config.command_ship_compact" label="Compact" persistent-hint hint="Makes the result smaller, does not have an image, does not have an embed."/>
          <v-switch v-model="guild.config.command_ship_detailed_enabled" label="Enable detailed option" persistent-hint hint="Returns more detailed stats of a ship, somewhat floods chat if abused."/>
          <v-radio-group v-model="guild.config.command_ship_image_size" label="Image size">
            <v-radio label="Small" :value="1"/>
            <v-radio label="Large" :value="2"/>
          </v-radio-group>
          </v-card>
        </div>
        <div v-else-if="section === 'channels'">
          <h2 class="display-1 font-weight-bold mb-3">Channels</h2>
          <v-row>
            <v-col style="flex-grow: 0; white-space: nowrap;">
              <v-radio-group mandatory class="mt-0" v-model="selectedChannel">
                <v-radio
                  v-for="channel in guild.channels" :key="channel.id.toString()"
                  :label="'#' + channel.name"
                  :value="channel"
                />
              </v-radio-group>
            </v-col>
            <v-col>
              <v-card class="pa-4">
                <h3 class="display-1 font-weight-light mb-2">#{{ selectedChannel.name }}</h3>
                <h4 class="mb-4">General</h4>
                <v-switch class="mt-0" v-model="selectedChannel.config.commands" label="Commands"/>
                <v-switch class="mt-0" v-model="selectedChannel.config.admin_event_pings" label="Admin event pings"/>
                <v-switch class="mt-0" v-model="selectedChannel.config.dps_updates" label="Announce DPS changes"/>
                <v-switch class="mt-0" v-model="selectedChannel.config.permits" label="Announce when a permit is added to Mega Base"/>
                <h4 class="mb-4">Kill Log</h4>
                <v-switch class="mt-0" v-model="selectedChannel.config.kill_log_enabled" label="This is a kill log channel"/>
                <v-switch class="mt-0" v-model="selectedChannel.config.kill_log_embed" label="Place the message in an embed"/>
                <v-switch class="mt-0" v-model="selectedChannel.config.kill_log_pin_limiteds" label="Automatically pin limited kills/deaths"/>
                <v-switch class="mt-0" v-model="selectedChannel.config.kill_log_daily_stats" label="Post daily statistics for your members"/>
                <v-switch class="mt-0" v-model="selectedChannel.config.kill_log_members" label="Include all of your guild members in this kill log"/>
                <h5 class="mb-4">Custom users</h5>
                <p>Include these users in this kill log</p>
                <v-chip-group>
                  <v-chip
                    v-for="member of selectedChannel.config.kill_log_custom_users"
                    :key="member.id"
                  >
                  </v-chip>
                </v-chip-group>
                <h5 class="mb-4">Templates</h5>
                <v-text-field class="mt-0" v-model="selectedChannel.config.kill_log_template_normal" label="Normal"/>
                <v-text-field class="mt-0" v-model="selectedChannel.config.kill_log_template_nuke" label="Nuke"/>
                <h5 class="mb-4">Classes</h5>
                <p class="my-4">When you kill a build menu ship</p>
                <v-row>
                  <v-col v-for="shipClass in shipClasses" :key="shipClass" class="pa-0 ml-2" style="flex-grow: 0;">
                    <v-checkbox
                      v-model="selectedChannel.config.kill_log_bm_kill_classes"
                      :label="shipClass.replace('_', ' ')"
                      :value="shipClass"
                      style="width: 15em;"
                    />
                  </v-col>
                </v-row>
                <p class="my-4">When you kill a limited ship</p>
                <v-row>
                  <v-col v-for="shipClass in shipClasses" :key="shipClass" class="pa-0 ml-2" style="flex-grow: 0;">
                    <v-checkbox
                      v-model="selectedChannel.config.kill_log_limited_kill_classes"
                      :label="shipClass.replace('_', ' ')"
                      :value="shipClass"
                      style="width: 15em;"
                    />
                  </v-col>
                </v-row>
                <p class="my-4">When you lose a build menu ship</p>
                <v-row>
                  <v-col v-for="shipClass in shipClasses" :key="shipClass" class="pa-0 ml-2" style="flex-grow: 0;">
                    <v-checkbox
                      v-model="selectedChannel.config.kill_log_bm_death_classes"
                      :label="shipClass.replace('_', ' ')"
                      :value="shipClass"
                      style="width: 15em;"
                    />
                  </v-col>
                </v-row>
                <p class="my-4">When you lose a limited ship</p>
                <v-row>
                  <v-col v-for="shipClass in shipClasses" :key="shipClass" class="pa-0 ml-2" style="flex-grow: 0;">
                    <v-checkbox
                      v-model="selectedChannel.config.kill_log_limited_death_classes"
                      :label="shipClass.replace('_', ' ')"
                      :value="shipClass"
                      style="width: 15em;"
                    />
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>
        </div>
        <div v-else>
          <span>unknown section, pick one over there ↩️</span>
        </div>
      </div>
    </GuildNav>
  </div>
</template>

<script>
import GuildNav from '@/components/GuildNav.vue'

export default {
  name: 'Guild',
  components: { GuildNav },
  data () {
    return {
      guild: { config: {}, loaded: false },
      saving: false,
      error: null,
      forceRequired: false,
      selectedChannel: {
        config: {}
      },
      shipClasses: [
        'Admin',
        'Fighter',
        'Miner',
        'Freighter',
        'Frigate',
        'Destroyer',
        'Cruiser',
        'Battlecruiser',
        'Battleship',
        'Dreadnought',
        'Carrier',
        'Super_Capital'
      ]
    }
  },
  computed: {
    section () {
      return this.$route.path.split('/')
        .filter(segment => segment) // if there's a trailing slash, filter it out
        .pop()
    }
  },
  mounted () {
    this.reloadData()
  },
  methods: {
    async reloadData () {
      this.guild.loaded = false

      const discordUser = this.$store.state.discordUser || await this.$store.state.fetchDiscordUser({ login: true })
      if (!discordUser) return console.log({ discordUser })

      const guild = await this.$api.http(`/v2/guildConfig/${this.$route.params.guildid}`)
      guild.loaded = true
      this.guild = guild

      this.error = guild.error
    },

    async save (force = false) {
      this.saving = true
      const res = await this.$api.http(`/v2/guildConfig/${this.$route.params.guildid}`, {
        post: {
          ...this.guild.config,
          channels: this.guild.channels.map(c => c.config),
          force
        }
      })

      if (res.error) return this.error = res.error
      this.forceRequired = !!res.requiresForce

      if (res.guild) {
        this.guild.config = res.guild
        for (const channel of res.channels) {
          const fullChannel = this.guild.channels.find(fullChannel => fullChannel.id === channel.id)
          if (fullChannel) fullChannel.config = channel
        }
      }

      this.saving = false
    }
  }
}
</script>