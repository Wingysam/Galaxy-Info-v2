<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <v-img
          :src="require('../assets/logo.png')"
          class="my-3"
          contain
          height="200"
        />
      </v-col>

      <v-col class="mb-4">
        <h1 class="display-2 font-weight-bold mb-3">
          Commands
        </h1>

        <p class="subheading font-weight-regular">
          All commands available on Galaxy Info
        </p>
      </v-col>
    </v-row>

    <div style="max-width: 70%;" class="mx-auto">
      <div v-for="category in Object.keys(commands)" :key="category">
        <h2 class="display-1 font-weight-bold my-4">{{ category }}</h2>
        <div v-for="command in commands[category]" :key="command.name">
          <v-card class="pa-4 my-4">
            <h3 class="display-1 font-weight-bold mb-3">{{ prefix }}{{ command.name }}</h3>
            <p v-if="command.aliases.length">
              AKA <span v-for="alias in command.aliases" :key="alias">
                <code class="mr-2">{{ prefix }}{{ alias }}</code>
              </span>
            </p>
            <p>{{ command.detailedDescription || command.description }}</p>
            <div v-if="command.flags.length">
              <h4>Flags</h4>
              <ul v-for="flag in command.flags" :key="flag">
                <li><code>-{{ flag }}</code></li>
              </ul>
            </div>
            <div v-if="command.examples.length">
              <h4>Examples</h4>
              <ul v-for="example in command.examples" :key="example">
                <li><code>{{ prefix }}{{ example }}</code></li>
              </ul>
            </div>
          </v-card>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script>
import commands from '@/help.json'

export default {
  name: 'Commands',
  data () {
    return {
      commands
    }
  },
  computed: {
    prefix () {
      return 'ng#'
    }
  }
}
</script>

<style scoped>
  @media only screen and (max-width: 959) {
    .marketing-image {
      width: 100%;
    }
  }
  @media only screen and (min-width: 960) {
    .marketing-image {
      width: 50%;
    }
  }
</style>