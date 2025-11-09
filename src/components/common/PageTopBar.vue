<template>
  <v-card class="page-topbar " elevation="0">
    <div class="topbar-content">
      <!-- Left: Breadcrumbs + Title -->
      <div class="topbar-left">
    
        <!-- Breadcrumbs 
        <div v-if="breadcrumbs && breadcrumbs.length > 0" class="breadcrumbs">
          <template v-for="(crumb, index) in breadcrumbs" :key="index">
            <router-link
              v-if="crumb.to"
              :to="crumb.to"
              class="breadcrumb-item"
            >
              {{ crumb.text }}
            </router-link>
            <span v-else class="breadcrumb-item current">
              {{ crumb.text }}
            </span>
            <v-icon
              v-if="index < breadcrumbs.length - 1"
              icon="mdi-chevron-right"
              size="small"
              class="breadcrumb-separator"
            />
          </template>
        </div>
      -->
        <!-- Title with Icon -->
        <div class="topbar-title-row">
          <v-tooltip location="top" :disabled="!description">
            <template #activator="{ props }">
              <v-icon
                v-bind="props"
                :icon="icon"
                size="32"
                color="primary"
                class="title-icon"
              />
            </template>
            <span>{{ description }}</span>
          </v-tooltip>
          
          <h1 class="topbar-title">
            {{ title }}
          </h1>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="topbar-actions">
        <!-- Search -->
        <div v-if="$slots.search" class="action-search">
          <slot name="search" />
        </div>

        <!-- Filters -->
        <div v-if="$slots.filters" class="action-filters">
          <slot name="filters" />
        </div>

        <!-- Action Buttons -->
        <div v-if="$slots.actions" class="action-buttons">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
export interface Breadcrumb {
  text: string
  to?: { name: string; params?: Record<string, any> } | string
}

defineProps<{
  title: string
  icon: string
  description?: string
  breadcrumbs?: Breadcrumb[]
}>()
</script>

<style scoped>
.page-topbar {
  margin-bottom: 24px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.topbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  gap: 24px;
}

.topbar-left {
  flex: 1;
  min-width: 0;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 0.75rem;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.breadcrumbs:hover {
  opacity: 1;
}

.breadcrumb-item {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.2s ease;
  white-space: nowrap;
}

.breadcrumb-item:hover:not(.current) {
  color: rgba(220, 20, 60, 1);
}

.breadcrumb-item.current {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.breadcrumb-separator {
  opacity: 0.4;
  margin: 0 2px;
}

.topbar-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.title-icon:hover {
  transform: scale(1.1);
}

.topbar-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.action-search {
  min-width: 250px;
  flex: 1;
}

.action-filters {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Responsive */
@media (max-width: 1400px) {
  .topbar-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .topbar-actions {
    width: 100%;
  }

  .action-search {
    flex: 1;
    min-width: 200px;
  }
}

@media (max-width: 960px) {
  .topbar-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .action-search,
  .action-filters,
  .action-buttons {
    width: 100%;
  }

  .action-filters {
    flex-wrap: wrap;
  }
}

@media (max-width: 600px) {
  .topbar-title {
    font-size: 1.5rem;
  }

  .breadcrumbs {
    font-size: 0.7rem;
  }
}
</style>

