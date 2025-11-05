<template>
  <v-app>
    <v-main class="auth-background">
      <v-container fluid fill-height>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="6" lg="4">
            <div class="text-center mb-8">
              <div class="logo-container">
                <v-icon icon="mdi-shield-sword" size="64" color="primary" class="mb-4" />
              </div>
              <h1 class="text-h3 font-weight-bold text-white mb-2 glow-text">
                Wildraft
              </h1>
              <p class="text-subtitle-1 text-grey-lighten-1">
                D&D Content Management System
              </p>
            </div>
            <router-view />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.auth-background {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

/* Use the gradient-background-animated class from global styles */
.auth-background {
  background: linear-gradient(135deg, #0F0F1E 0%, #1A1A2E 50%, #16213E 100%);
}

.auth-background::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(220, 20, 60, 0.1) 0%, transparent 70%);
  animation: pulse 8s ease-in-out infinite;
}

.auth-background::after {
  content: '';
  position: absolute;
  bottom: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(156, 39, 176, 0.08) 0%, transparent 70%);
  animation: pulse 10s ease-in-out infinite reverse;
}

.logo-container {
  animation: float 3s ease-in-out infinite;
}

:deep(.v-container) {
  z-index: 1;
  position: relative;
}
</style>




