<template>
  <div>
    <v-textarea
      v-model="textbox"
      outlined
      auto-grow
      no-resize
      :error-messages="errors"
      @input="parseAndUpdate()"
    />
  </div>
</template>

<script>
export default {
  name: 'RobloxUserIdArrayInput',
  props: {
    value: {
      type: Array,
      default () { return [] }
    }
  },
  data () {
    return {
      errors: [],
      textbox: ''
    }
  },
  watch: {
    value: {
       handler () {
        this.textbox = this.value.join('\n')
      }
    }
  },
  methods: {
    parseAndUpdate() {
      const ids = []
      this.errors = []
      for (const line of this.textbox.split('\n')) {
        if (!line) continue
        try {
          ids.push(BigInt(line))
        } catch {
          this.errors = [`${line} is not a roblox id`]
          return
        }
      }
      this.$emit('input', ids)
    }
  }
}
</script>
