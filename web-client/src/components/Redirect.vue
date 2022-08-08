<template>
  <v-container>
    <p v-if="error">
      Failed to redirect.
    </p>
  </v-container>
</template>

<script>
export default {
  name: 'Redirect',
  props: {
    href: {
      type: String,
      default: undefined
    },
    to: {
      type: String,
      default: undefined
    }
  },
  data () {
    return {
      error: false
    }
  },
  mounted() {
    if (this.to) this.$router.push(this.to)
    else if (this.href) location.href = this.href
    else this.error = true
  }
}
</script>
