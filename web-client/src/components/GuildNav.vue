<template>
  <v-container class="ml-0 mr-1" style="max-width: 100%; /* there's a style setting max-width so we have to override it, that's why we don't use width here */">
    <v-row>
      <v-col style="flex-grow: 0;">
        <v-card
          elevation="12"
          width="256"
        >
          <v-navigation-drawer
            floating
            permanent
          >
            <v-list
              dense
            >
              <v-list-item
                v-for="item in items"
                :key="item.title"
                exact link :to="item.to"
              >
                <v-list-item-icon>
                  <v-icon>{{ item.icon }}</v-icon>
                </v-list-item-icon>

                <v-list-item-content>
                  <v-list-item-title>{{ item.title }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-navigation-drawer>
        </v-card>
      </v-col>
      <v-col style="min-width: 70%; max-width: 100%; /* same max-width trick here */">
        <div v-if="guild.loaded">
          <div class="ma-0" style="white-space: nowrap; display: flex;">
            <span class="d-inline-block">
              <v-img :src="guild.icon || require('@/assets/discord.svg')" width="4em" height="4em" contain transition="slide-x-transition"/>
            </span>
            <span class="d-inline-block ml-4" style="overflow: hidden;">
              <h2 class="text-h2" style="height: 1.5em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ guild.name }}</h2>
            </span>
          </div>
          <slot/>
        </div>
        <div v-else class="mt-2">
          <v-progress-circular indeterminate/>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'GuildNav',
  props: [ 'guild' ],
  data () {
    return {
      items: [
        { title: 'General', icon: 'mdi-view-dashboard', to: this.sectionLink('general') },
        { title: 'Commands', icon: 'mdi-slash-forward-box', to: this.sectionLink('commands') },
        { title: 'Channels', icon: 'mdi-pound', to: this.sectionLink('channels') },
        { title: 'Back to Guilds', icon: 'mdi-arrow-left', to: '/guilds' }
      ]
    }
  },
  methods: {
    sectionLink (section) {
      return `/guilds/${this.$route.params.guildid}/${section}`
    }
  }
}
</script>